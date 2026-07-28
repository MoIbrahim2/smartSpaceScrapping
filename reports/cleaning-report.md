# SmartSpaceAI Data Cleaning & Quality Report

## 1. Pipeline Execution Performance Metrics

- **Total Execution Time:** 1401 ms
- **Throughput Speed:** 2827 products/second
- **Peak Process Memory:** 46.24 MB

---

## 2. Product Quality Scoring Summary

All accepted products are scored from 0 to 100 based on standard design criteria.

- **EXCELLENT (80-100):** 1606 products
- **GOOD (60-79):** 0 products
- **INCOMPLETE (40-59):** 0 products
- **POOR (0-39):** 0 products

---

## 3. Extraction Quality & Schema Sanitization Issues

Summary of warnings flagged during processing:

| Issue Key / Warning Flag | Occurrence Count | Description |
| :--- | :--- | :--- |
| `reparsed_from_title` | 19 | Warnings generated during parsing/sanitization |
| `height_out_of_bounds` | 58 | Warnings generated during parsing/sanitization |
| `dimensions_imputed_realistic` | 96 | Warnings generated during parsing/sanitization |
| `missing_materials` | 353 | Warnings generated during parsing/sanitization |
| `generic_brand` | 240 | Warnings generated during parsing/sanitization |
| `ambiguous_dimensions` | 58 | Warnings generated during parsing/sanitization |
| `swapped_width_length` | 5 | Warnings generated during parsing/sanitization |
| `short_or_missing_description` | 21 | Warnings generated during parsing/sanitization |
| `package_dimensions_detected` | 9 | Warnings generated during parsing/sanitization |
