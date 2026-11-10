#!/usr/bin/env python3
"""Reproduce this example's arithmetic offline; no model or account access."""

import csv
import json
from collections import defaultdict
from decimal import Decimal
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ZERO = Decimal(0)
HUNDRED = Decimal(100)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_rows(name, weight_column):
    with (ROOT / name).open(newline="", encoding="utf-8") as source:
        rows = list(csv.DictReader(source))
    require(bool(rows), f"{name}: empty file")
    for row in rows:
        require(row["as_of"] == "2026-01-31", f"{name}: unexpected date")
        require(row["data_kind"] == "synthetic", f"{name}: unlabeled data")
        weight = Decimal(row[weight_column])
        require(weight.is_finite() and ZERO <= weight <= HUNDRED,
                f"{name}: invalid weight")
        row[weight_column] = weight
    return rows


def analyze(rows, constituents):
    require(sum((r["portfolio_weight_pct"] for r in rows), ZERO) == HUNDRED,
            "Portfolio weights must sum to 100")
    exposures = defaultdict(Decimal)
    cash = ZERO
    seen = set()
    for row in rows:
        identity = row["holding_id"]
        require(identity not in seen, "Duplicate portfolio holding")
        seen.add(identity)
        require(row["base_currency"] == "EUR", "Unexpected currency")
        weight = row["portfolio_weight_pct"]
        if row["holding_type"] == "cash":
            cash += weight
        else:
            require(row["holding_type"] == "fund" and identity in constituents,
                    "Unknown holding or missing constituent coverage")
            for company, fund_weight in constituents[identity].items():
                exposures[company] += weight * fund_weight / HUNDRED
    require(sum(exposures.values(), cash) == HUNDRED,
            "Look-through and cash do not reconcile")
    return dict(exposures), cash


def main():
    constituents = defaultdict(dict)
    for row in read_rows("sample-fund-holdings.csv", "fund_weight_pct"):
        fund, company = row["fund_id"], row["company_id"]
        require(company not in constituents[fund], "Duplicate constituent")
        constituents[fund][company] = row["fund_weight_pct"]
    require(set(constituents) == {"DEMO_GLOBAL_FUND", "DEMO_TECH_FUND"},
            "Unexpected funds")
    require(all(sum(weights.values(), ZERO) == HUNDRED
                for weights in constituents.values()), "Incomplete fund coverage")
    current_rows = read_rows("sample-portfolio.csv", "portfolio_weight_pct")
    proposed_rows = read_rows("sample-proposal.csv", "portfolio_weight_pct")
    current, cash = analyze(current_rows, constituents)
    proposed, proposed_cash = analyze(proposed_rows, constituents)

    # Independent expected values for the public worked example, on a whole-
    # portfolio basis. Decimal avoids silently rounding a rule-boundary breach.
    expected_current = dict(zip(
        ["DEMO_A", "DEMO_B", "DEMO_C", "DEMO_D", "DEMO_E"],
        map(Decimal, ["39", "27", "12", "6", "6"])))
    expected_proposed = dict(zip(expected_current,
                                map(Decimal, ["40.5", "27", "9", "4.5", "9"])))
    require(current == expected_current, "Current worked exposures changed")
    require(proposed == expected_proposed, "Proposed worked exposures changed")
    require(cash == proposed_cash == Decimal(10), "Cash must remain 10%")
    old = {r["holding_id"]: r["portfolio_weight_pct"] for r in current_rows}
    new = {r["holding_id"]: r["portfolio_weight_pct"] for r in proposed_rows}
    require(new["DEMO_GLOBAL_FUND"] - old["DEMO_GLOBAL_FUND"] == -15
            and new["DEMO_TECH_FUND"] - old["DEMO_TECH_FUND"] == 15,
            "Proposal must be a 15-percentage-point internal shift")

    global_fund = constituents["DEMO_GLOBAL_FUND"]
    tech_fund = constituents["DEMO_TECH_FUND"]
    common = global_fund.keys() & tech_fund.keys()
    overlap = sum((min(global_fund[c], tech_fund[c]) for c in common), ZERO)
    blend_common = sum((global_fund[c] + tech_fund[c] for c in common), ZERO) / 2
    current_common = sum((current[c] for c in common), ZERO)
    proposed_common = sum((proposed[c] for c in common), ZERO)
    require(overlap == 70 and blend_common == 75, "Fund metrics changed")
    require(current_common == 66 and proposed_common == Decimal("67.5"),
            "Shared-company whole-portfolio exposure changed")

    # These thresholds belong to this fictional investor, not a recommended policy.
    ceiling = Decimal(40)
    breaches = {c: weight - ceiling for c, weight in proposed.items()
                if weight > ceiling}
    require(breaches == {"DEMO_A": Decimal("0.5")}, "Expected breach changed")
    require(max(current.values()) <= ceiling, "Current portfolio breaches ceiling")
    require(60 <= HUNDRED - cash <= 90 and 60 <= HUNDRED - proposed_cash <= 90,
            "Equity range changed")
    print(json.dumps({
        "status": "worked_arithmetic_verified",
        "whole_portfolio_current_pct": current,
        "whole_portfolio_proposed_pct": proposed,
        "cash_pct": cash,
        "fund_pair_matched_minimum_overlap_pct": overlap,
        "equal_blend_common_name_pct": blend_common,
        "shared_company_current_pct": current_common,
        "shared_company_proposed_pct": proposed_common,
        "proposed_company_breach_percentage_points": breaches,
        "model_calls": 0,
    }, default=str, indent=2))


if __name__ == "__main__":
    main()
