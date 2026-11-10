"""Offline gross rebalance reference; no model, provider or account calls."""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP, ROUND_CEILING
import csv
import hashlib
import json

ROOT = Path(__file__).resolve().parent
ZERO = Decimal('0')
HUNDRED = Decimal('100')
CASH = 'CASH_EUR'


def money(value):
    return Decimal(value).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def read_csv(root, name):
    with (root / name).open() as stream:
        return list(csv.DictReader(stream))


def load_inputs(root=ROOT):
    plan = json.loads((root / 'sample-plan.json').read_text())
    provenance = json.loads((root / 'provenance.json').read_text())
    raw = (root / 'sample-market-data.csv').read_bytes()
    if hashlib.sha256(raw).hexdigest() != provenance['snapshot_sha256']:
        raise ValueError('Market observation snapshot hash mismatch')
    market = read_csv(root, 'sample-market-data.csv')
    observations, identities = {}, {}
    for row in market:
        key = (row['holding_id'], row['valuation_date'])
        if key in observations:
            raise ValueError('Duplicate listing/date observation')
        if row['currency'] != 'EUR' or row['return_basis'] != 'total_return':
            raise ValueError('Mixed currency or unsupported return basis')
        identity = (row['isin'], row['dataset_stamp'])
        if row['holding_id'] in identities and identities[row['holding_id']] != identity:
            raise ValueError('Mixed listing identity or source dataset')
        identities[row['holding_id']] = identity
        value = Decimal(row['observed_series_value'])
        if not value.is_finite() or value <= 0:
            raise ValueError('Nonpositive or nonfinite series value')
        observations[key] = value
    start, current = {}, {}
    for row in read_csv(root, 'sample-portfolio.csv'):
        key = row['holding_id']
        if key in start or row['base_currency'] != 'EUR':
            raise ValueError('Duplicate holding or mixed portfolio currency')
        start[key] = money(row['initial_notional_eur'])
        if start[key] < 0:
            raise ValueError('Negative notional')
        if key != CASH and (key not in identities or row['isin'] != identities[key][0]):
            raise ValueError('Portfolio and market listing identities differ')
        try:
            current[key] = start[key] if key == CASH else money(
                start[key] * observations[(key, plan['valuation_date'])]
                / observations[(key, row['start_date'])])
        except KeyError as error:
            raise ValueError('Required valuation observation is missing') from error
    target = {key: Decimal(value) / HUNDRED
              for key, value in plan['target_weights_pct'].items()}
    if set(target) != set(current) or sum(target.values()) != 1:
        raise ValueError('Target keys or total do not match the portfolio')
    if any(not t.is_finite() or t <= 0 for t in target.values()):
        raise ValueError('This reference requires positive finite targets')
    return plan, target, start, current


def allocation(values):
    total = sum(values.values())
    return {key: value / total * HUNDRED for key, value in values.items()}


def exact_delta(current, target, incoming):
    total = sum(current.values()) + incoming
    after = {key: money(total * share) for key, share in target.items() if key != CASH}
    after[CASH] = total - sum(after.values())
    return {key: after[key] - current[key] for key in current}


def buy_only_delta(current, target, incoming, cash_floor):
    """Measure deficits AFTER injecting cash; never spend more than new cash."""
    if incoming < 0:
        raise ValueError('Negative contribution')
    total = sum(current.values()) + incoming
    deficits = {key: max(ZERO, money(total * target[key]) - value)
                for key, value in current.items() if key != CASH}
    cap = min(incoming, max(ZERO, current[CASH] + incoming - cash_floor))
    required = sum(deficits.values())
    scale = min(Decimal('1'), cap / required) if required else ZERO
    delta = {key: money(deficits[key] * scale) for key in deficits}
    # Money rounding must never overspend the cash cap.
    while sum(delta.values()) > cap:
        key = max(delta, key=delta.get)
        delta[key] -= Decimal('0.01')
    delta[CASH] = incoming - sum(delta.values())
    return delta


def summarize(current, target, incoming, delta, plan):
    if sum(delta.values()) != incoming:
        raise ValueError('Cash flow is not conserved')
    after = {key: current[key] + delta[key] for key in current}
    if any(value < 0 for value in after.values()):
        raise ValueError('Negative final value')
    weights = allocation(after)
    band = Decimal(plan['tolerance_band_pp'])
    return dict(
        incoming_cash_eur=incoming,
        changes_eur=delta,
        after_values_eur=after,
        after_weights_pct=weights,
        gross_sales_eur=sum(-v for k, v in delta.items() if k != CASH and v < 0),
        gross_buys_eur=sum(v for k, v in delta.items() if k != CASH and v > 0),
        reserve_ok=after[CASH] >= Decimal(plan['minimum_portfolio_cash_eur']),
        within_bands=all(abs(weights[k] - target[k] * HUNDRED) <= band for k in target),
        at_target_to_cent=all(abs(after[k] - money(sum(after.values()) * target[k])) <= Decimal('0.01') for k in target),
        after_cost_feasibility='not_established',
        executable_share_quantities='not_available_from_total_return_series',
    )


def compare(root=ROOT):
    plan, target, start, current = load_inputs(root)
    floor = Decimal(plan['minimum_portfolio_cash_eur'])
    available = Decimal(plan['external_cash_available_eur'])
    routes = {}
    for name, spec in plan['routes'].items():
        incoming = money(spec['incoming_cash_eur'])
        if incoming < 0 or incoming > available:
            raise ValueError('Route exceeds available external cash')
        if name == 'new_cash_buy_only':
            delta = buy_only_delta(current, target, incoming, floor)
        elif name == 'existing_cash_only':
            gap = max(ZERO, money(sum(current.values()) * target['EXS1.DE']) - current['EXS1.DE'])
            spend = min(gap, max(ZERO, current[CASH] - floor))
            delta = {key: ZERO for key in current}
            delta['EXS1.DE'], delta[CASH] = spend, -spend
        else:
            delta = exact_delta(current, target, incoming)
        if not spec['sell_allowed'] and any(v < 0 for k, v in delta.items() if k != CASH):
            raise ValueError('Unexpected sale in a buy-only route')
        routes[name] = summarize(current, target, incoming, delta, plan)
    proposals = read_csv(root, 'sample-proposal.csv')
    keys = [(r['route_id'], r['holding_id']) for r in proposals]
    expected = {(name, key) for name in routes for key in current}
    if len(keys) != len(expected) or set(keys) != expected:
        raise ValueError('Missing or duplicate proposal row')
    for row in proposals:
        if Decimal(row['change_eur']) != routes[row['route_id']]['changes_eur'][row['holding_id']]:
            raise ValueError('Proposal does not match the derived reference')
    baseline = summarize(current, target, ZERO, {key: ZERO for key in current}, plan)
    minimum = max(ZERO, max(current[k] / target[k] for k in current) - sum(current.values()))
    minimum = minimum.quantize(Decimal('0.01'), rounding=ROUND_CEILING)
    return dict(status='gross_reference_comparison_verified',
                start_values_eur=start, current_values_eur=current,
                current_weights_pct=allocation(current), current_total_eur=sum(current.values()),
                modeled_historical_growth_eur=sum(current.values())-sum(start.values()),
                minimum_new_cash_for_exact_unrounded_targets_eur=minimum,
                baseline=baseline, routes=routes, model_calls=0)


def serializable(value):
    if isinstance(value, Decimal):
        return str(value)
    raise TypeError(type(value))


if __name__ == '__main__':
    print(json.dumps(compare(), default=serializable, indent=2))
