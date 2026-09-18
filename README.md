# ToolVerse USA

[![Live site](https://img.shields.io/badge/live_site-ToolVerse-06b6d4?style=flat-square)](https://toolverseusa.github.io/ToolVerse/)
[![License](https://img.shields.io/github/license/ToolVerseUSA/ToolVerse?style=flat-square)](LICENSE)
[![Public repository](https://img.shields.io/badge/repository-public-8b5cf6?style=flat-square)](https://github.com/ToolVerseUSA/ToolVerse)

**Practical, browser-based financial planning tools for everyday decisions.**

[Open ToolVerse](https://toolverseusa.github.io/ToolVerse/) · [Browse the tools](https://toolverseusa.github.io/ToolVerse/all-categories.html) · [Review the methodology](https://toolverseusa.github.io/ToolVerse/whitepaper.html)

ToolVerse helps people turn a financial question into a clearer planning scenario. The calculators cover affordability, rent, take-home pay, housing, debt, insurance, moving, and related household decisions. The site is designed for quick estimates and transparent trade-offs—not for presenting an estimate as a guarantee or professional advice.

## What ToolVerse helps you explore

| Decision area | Start here |
| --- | --- |
| **Affordability** | [Can I Afford This?](https://toolverseusa.github.io/ToolVerse/) — combine income, rent, debt, expenses, and estimated take-home pay. |
| **Rent and housing** | [True Cost of Renting](https://toolverseusa.github.io/ToolVerse/true-cost-of-renting-calculator.html), [Rent Affordability](https://toolverseusa.github.io/ToolVerse/rent-affordability-calculator.html), and [First Apartment Budget](https://toolverseusa.github.io/ToolVerse/first-apartment-budget-calculator.html). |
| **Salary and take-home pay** | [Salary After Rent](https://toolverseusa.github.io/ToolVerse/salary-after-rent-calculator.html), [Salary Needed for Rent](https://toolverseusa.github.io/ToolVerse/salary-needed-for-rent-calculator.html), and [Paycheck Withholding Checkup](https://toolverseusa.github.io/ToolVerse/paycheck-withholding-take-home-checkup.html). |
| **Home buying** | [Mortgage Payment](https://toolverseusa.github.io/ToolVerse/mortgage-payment-calculator.html), [Home Affordability](https://toolverseusa.github.io/ToolVerse/home-affordability-calculator.html), [Down Payment Plan](https://toolverseusa.github.io/ToolVerse/down-payment-calculator.html), and [Closing Costs](https://toolverseusa.github.io/ToolVerse/closing-costs-calculator.html). |
| **Debt and budgeting** | [Debt-to-Income Capacity](https://toolverseusa.github.io/ToolVerse/debt-to-income-monthly-payment-capacity-calculator.html), [Emergency Fund Income Shock](https://toolverseusa.github.io/ToolVerse/emergency-fund-income-shock-calculator.html), and [Roommate Rent Split](https://toolverseusa.github.io/ToolVerse/roommate-rent-split-calculator.html). |
| **Insurance planning** | [Car Insurance Cost Estimator](https://toolverseusa.github.io/ToolVerse/car-insurance-cost-estimator.html), [Renters Insurance Coverage](https://toolverseusa.github.io/ToolVerse/renters-insurance-coverage-calculator.html), and [Home Insurance Estimate](https://toolverseusa.github.io/ToolVerse/home-insurance-estimate-calculator.html). |
| **Moving and career decisions** | [Job Offer Comparison](https://toolverseusa.github.io/ToolVerse/job-offer-take-home-rent-comparison.html) and [Relocation Break-Even](https://toolverseusa.github.io/ToolVerse/relocation-break-even-calculator.html). |
| **UK pilot tools** | [UK Tools](https://toolverseusa.github.io/ToolVerse/uk/) — a separate regional area beginning with [Student Loan Repayment](https://toolverseusa.github.io/ToolVerse/uk/student-loan-repayment-calculator.html). |

[See all calculators and guides →](https://toolverseusa.github.io/ToolVerse/all-categories.html)

## How it works

1. Choose the decision that matches your question.
2. Enter the assumptions you know, such as income, rent, debt, recurring costs, or a target price.
3. Review the estimate, ratios, trade-offs, and next-step tools.
4. Verify important decisions with current official information and an appropriately qualified professional.

Calculations run in the browser. ToolVerse does not require an account for the core experience. Some browser features, such as recent calculations, may use local browser storage when available.

## Methodology and limitations

ToolVerse provides **educational planning estimates**. Results depend on the values and assumptions entered by the user, and they can differ from a lender quote, insurance premium, tax filing, benefits determination, rent approval decision, or other real-world outcome.

The U.S. tools use documented planning assumptions and public reference material where applicable. ToolVerse is not affiliated with, endorsed by, or a substitute for the IRS, SSA, CFPB, HUD, the Federal Reserve, an insurance carrier, a lender, or a government agency. Review the [methodology and sources](https://toolverseusa.github.io/ToolVerse/whitepaper.html) before relying on an estimate.

## Privacy and browser-first design

ToolVerse is built around a browser-first workflow so users can test a scenario without creating an account for the core calculators. Do not enter information that you do not want stored in your own browser or shared through your device. Read the [privacy information](https://toolverseusa.github.io/ToolVerse/privacy.html) and [terms](https://toolverseusa.github.io/ToolVerse/terms.html) for the current details.

## Project structure

This is a static HTML, CSS, and JavaScript site hosted on GitHub Pages. The repository contains:

- Calculator and guide pages in the repository root.
- Regional tools under [`uk/`](uk/).
- Shared navigation and presentation styles in [`navigation.css`](navigation.css), [`guides.css`](guides.css), and related stylesheets.
- Calculator logic in page-specific scripts and shared JavaScript files.
- Search and discovery files such as [`sitemap.xml`](sitemap.xml), [`robots.txt`](robots.txt), and [`site.webmanifest`](site.webmanifest).

## Contributing and corrections

ToolVerse is maintained as a public project. If you find a broken link, accessibility problem, incorrect assumption, outdated source, or calculation concern, please use the [contact page](https://toolverseusa.github.io/ToolVerse/contact.html) or open a focused GitHub issue with the page URL, the steps to reproduce the concern, and the expected behavior. Do not include private financial information in an issue.

Before proposing a code change, preserve the existing calculator behavior, explain the user-facing reason for the change, and include the smallest reproducible QA evidence available.

## License

ToolVerse is distributed under the license in [`LICENSE`](LICENSE). The website provides planning information and does not provide financial, tax, legal, lending, insurance, or investment advice.

## Links

- [Live website](https://toolverseusa.github.io/ToolVerse/)
- [All tools and guides](https://toolverseusa.github.io/ToolVerse/all-categories.html)
- [About ToolVerse](https://toolverseusa.github.io/ToolVerse/about.html)
- [Methodology and sources](https://toolverseusa.github.io/ToolVerse/whitepaper.html)
- [Privacy](https://toolverseusa.github.io/ToolVerse/privacy.html)
- [Contact](https://toolverseusa.github.io/ToolVerse/contact.html)

> ToolVerse is for planning clarity—not certainty. Use the estimate as a starting point, then verify the decision with current official information.

<!--
Maintenance note: keep the README aligned with the live product. Do not add unsupported
claims, government affiliation, user counts, awards, performance metrics, or financial
outcome guarantees without verifiable evidence.
-->
