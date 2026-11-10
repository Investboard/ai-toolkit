"""Financial invariants and refusal cases for the offline demo reference."""
from decimal import Decimal
from pathlib import Path
import hashlib
import json
import shutil
import tempfile
import unittest

import verify

D = Decimal


class RebalanceDemoTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.result = verify.compare()
        cls.plan, cls.target, _, cls.current = verify.load_inputs()

    def copy_inputs(self, directory):
        root = Path(directory)
        for name in ['sample-plan.json', 'sample-portfolio.csv', 'sample-market-data.csv',
                     'sample-proposal.csv', 'provenance.json']:
            shutil.copy2(verify.ROOT / name, root / name)
        return root

    def test_unchanged_baseline_passes_without_forcing_a_trade(self):
        self.assertTrue(self.result['baseline']['within_bands'])
        self.assertTrue(self.result['baseline']['reserve_ok'])
        self.assertFalse(self.result['baseline']['at_target_to_cent'])
        self.assertTrue(all(v == 0 for v in self.result['baseline']['changes_eur'].values()))

    def test_new_cash_changes_the_denominator_and_is_used_once(self):
        route = self.result['routes']['new_cash_buy_only']
        self.assertGreater(self.result['current_weights_pct']['equities'], 90)
        diluted = self.current['equities'] / (self.result['current_total_eur'] + D('400')) * 100
        self.assertLess(diluted, 90)
        self.assertGreater(route['changes_eur']['equities'], 0)
        self.assertEqual(sum(route['changes_eur'].values()), D('400'))
        self.assertEqual(sum(route['after_values_eur'].values()), self.result['current_total_eur'] + D('400'))
        self.assertEqual(route['gross_sales_eur'], 0)
        self.assertTrue(route['at_target_to_cent'])
        self.assertEqual(route['after_cost_feasibility'], 'not_established')

    def test_small_contribution_stays_in_cash_without_inventing_an_equity_buy(self):
        route = self.result['routes']['small_cash_buy_only']
        self.assertEqual(route['incoming_cash_eur'], 100)
        self.assertEqual(sum(route['changes_eur'].values()), 100)
        self.assertEqual(route['changes_eur']['equities'], 0)
        self.assertEqual(route['after_values_eur'][verify.CASH], self.current[verify.CASH] + 100)
        self.assertTrue(route['reserve_ok'])
        self.assertTrue(route['within_bands'])
        self.assertFalse(route['at_target_to_cent'])
        self.assertLess(route['max_abs_drift_pp'], self.result['baseline']['max_abs_drift_pp'])

    def test_hybrid_reduces_sales_without_calling_new_cash_a_return(self):
        hybrid = self.result['routes']['hybrid']
        sale = self.result['routes']['sell_and_buy']
        self.assertLess(hybrid['gross_sales_eur'], sale['gross_sales_eur'])
        for route in self.result['routes'].values():
            self.assertEqual(sum(route['after_values_eur'].values()) - self.result['current_total_eur'],
                             route['incoming_cash_eur'])
            self.assertTrue(route['reserve_ok'])
            self.assertEqual(route['executable_share_quantities'],
                             'not_available_from_total_return_series')

    def test_small_contribution_is_partial_and_never_sells(self):
        incoming = D('100')
        delta = verify.buy_only_delta(self.current, self.target, incoming, D('800'))
        route = verify.summarize(self.current, self.target, incoming, delta, self.plan)
        self.assertFalse(route['at_target_to_cent'])
        self.assertEqual(route['gross_sales_eur'], 0)
        self.assertLessEqual(route['gross_buys_eur'], incoming)
        self.assertTrue(route['reserve_ok'])
        self.assertTrue(route['within_bands'])

    def test_routes_cannot_use_unavailable_external_cash(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.copy_inputs(directory)
            plan = json.loads((root / 'sample-plan.json').read_text())
            plan['external_cash_available_eur'] = '100'
            (root / 'sample-plan.json').write_text(json.dumps(plan))
            with self.assertRaisesRegex(ValueError, 'exceeds available'):
                verify.compare(root)

    def test_a_stale_or_edited_proposal_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = self.copy_inputs(directory)
            path = root / 'sample-proposal.csv'
            path.write_text(path.read_text().replace('229.38', '229.39'))
            with self.assertRaisesRegex(ValueError, 'Proposal does not match'):
                verify.compare(root)

    def test_mixed_currency_basis_or_dataset_is_rejected(self):
        for original, replacement in [('EUR', 'USD'), ('total_return', 'price_return'),
                                      ('4be2a6f8', '0be2a6f8')]:
            with self.subTest(replacement=replacement), tempfile.TemporaryDirectory() as directory:
                root = self.copy_inputs(directory)
                path = root / 'sample-market-data.csv'
                path.write_text(path.read_text().replace(original, replacement, 1))
                provenance = json.loads((root / 'provenance.json').read_text())
                provenance['snapshot_sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
                (root / 'provenance.json').write_text(json.dumps(provenance))
                with self.assertRaises(ValueError):
                    verify.load_inputs(root)


if __name__ == '__main__':
    unittest.main()
