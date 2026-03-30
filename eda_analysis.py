"""
Comprehensive Exploratory Data Analysis (EDA) for Sales Data
Includes: Data Cleaning, Summary Statistics, Distribution Analysis, 
Correlation Analysis, Outlier Detection, and Key Insights
"""

import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

print("="*80)
print("EXPLORATORY DATA ANALYSIS (EDA) - SALES DATA")
print("="*80)

# ============================================================================
# STEP 1: LOAD THE DATASET
# ============================================================================
print("\n[STEP 1] LOADING DATASET...")
try:
    df = pd.read_csv('sample_data.csv')
    print(f"✓ Dataset loaded successfully")
    print(f"  Shape: {df.shape[0]} rows × {df.shape[1]} columns")
except FileNotFoundError:
    print("✗ Error: sample_data.csv not found")
    exit(1)

# ============================================================================
# STEP 2: DATA CLEANING
# ============================================================================
print("\n[STEP 2] DATA CLEANING...")

# 2.1 Display initial data
print("\n2.1 Initial Data Structure:")
print("-" * 50)
print(df.head())

# 2.2 Check for missing values
print("\n2.2 Missing Values Analysis:")
print("-" * 50)
missing = df.isnull().sum()
if missing.sum() == 0:
    print("✓ No missing values found")
else:
    print(missing[missing > 0])
    df = df.dropna()
    print(f"✓ Dropped rows with missing values. New shape: {df.shape}")

# 2.3 Check for duplicates
print("\n2.3 Duplicate Detection:")
print("-" * 50)
duplicates = df.duplicated().sum()
if duplicates == 0:
    print("✓ No duplicate rows found")
else:
    print(f"  Found {duplicates} duplicate rows")
    df = df.drop_duplicates()
    print(f"  New shape after removing duplicates: {df.shape}")

# 2.4 Data Type Analysis
print("\n2.4 Data Types Analysis:")
print("-" * 50)
print(df.dtypes)

# Identify numeric and categorical columns
numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
categorical_cols = df.select_dtypes(include=['object']).columns.tolist()

print(f"\n  Numeric Columns: {numeric_cols}")
print(f"  Categorical Columns: {categorical_cols}")

# ============================================================================
# STEP 3: EXPLORATORY DATA ANALYSIS
# ============================================================================
print("\n[STEP 3] EXPLORATORY DATA ANALYSIS...")

# 3.1 Summary Statistics
print("\n3.1 Summary Statistics (Numeric Columns):")
print("-" * 50)
summary_stats = df[numeric_cols].describe()
print(summary_stats)

# 3.2 Detailed statistical measures
print("\n3.2 Detailed Statistical Measures:")
print("-" * 50)
for col in numeric_cols:
    data = df[col]
    print(f"\n  {col}:")
    print(f"    Mean:       {data.mean():,.0f}")
    print(f"    Median:     {data.median():,.0f}")
    print(f"    Std Dev:    {data.std():,.0f}")
    print(f"    Variance:   {data.var():,.0f}")
    print(f"    Skewness:   {data.skew():.2f}")
    print(f"    Kurtosis:   {data.kurtosis():.2f}")
    print(f"    Range:      {data.max() - data.min():,.0f}")

# 3.3 Categorical Columns Analysis
print("\n3.3 Categorical Columns Analysis:")
print("-" * 50)
for col in categorical_cols:
    print(f"\n  {col}:")
    print(f"    Unique values: {df[col].nunique()}")
    print(f"    Values: {df[col].unique().tolist()}")
    print(f"    Value counts:")
    print(df[col].value_counts().to_string().replace('\n', '\n      '))

# ============================================================================
# STEP 4: DISTRIBUTION ANALYSIS
# ============================================================================
print("\n[STEP 4] DISTRIBUTION ANALYSIS...")

print("\n4.1 Sales Distribution (Across Quarters):")
print("-" * 50)
quarters = ['Q1_Sales', 'Q2_Sales', 'Q3_Sales', 'Q4_Sales']
for q in quarters:
    if q in df.columns:
        print(f"\n  {q}:")
        print(f"    Min:        {df[q].min():,.0f}")
        print(f"    Q1 (25%):   {df[q].quantile(0.25):,.0f}")
        print(f"    Q2 (50%):   {df[q].quantile(0.50):,.0f}")
        print(f"    Q3 (75%):   {df[q].quantile(0.75):,.0f}")
        print(f"    Max:        {df[q].max():,.0f}")
        print(f"    IQR:        {df[q].quantile(0.75) - df[q].quantile(0.25):,.0f}")

# ============================================================================
# STEP 5: RELATIONSHIP ANALYSIS
# ============================================================================
print("\n[STEP 5] RELATIONSHIP ANALYSIS...")

# 5.1 Correlation between quarters
print("\n5.1 Correlation Between Quarters:")
print("-" * 50)
quarter_cols = [col for col in numeric_cols if 'Sales' in col or 'Q' in col]
if len(quarter_cols) > 1:
    correlation_matrix = df[quarter_cols].corr()
    print(correlation_matrix.round(3))
    
    # Find strongest correlations
    print("\n  Strongest Correlations:")
    for col in correlation_matrix.columns:
        corr_vals = correlation_matrix[col].drop(col).sort_values(ascending=False)
        if len(corr_vals) > 0:
            print(f"    {col}: {corr_vals.iloc[0]:.3f}")

# 5.2 Category Analysis
print("\n5.2 Category Analysis:")
print("-" * 50)
if 'Category' in df.columns:
    category_sales = df.groupby('Category')[numeric_cols].sum()
    print("\n  Total Sales by Category:")
    print(category_sales)
    
    print("\n  Average Sales by Category:")
    category_avg = df.groupby('Category')[numeric_cols].mean()
    print(category_avg.round(0))

# 5.3 Region Analysis
print("\n5.3 Region Analysis:")
print("-" * 50)
if 'Region' in df.columns:
    region_sales = df.groupby('Region')[numeric_cols].sum()
    print("\n  Total Sales by Region:")
    print(region_sales)
    
    print("\n  Average Sales by Region:")
    region_avg = df.groupby('Region')[numeric_cols].mean()
    print(region_avg.round(0))

# ============================================================================
# STEP 6: OUTLIER DETECTION
# ============================================================================
print("\n[STEP 6] OUTLIER DETECTION (Using IQR Method)...")
print("-" * 50)

outliers_found = False
for col in numeric_cols:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    outlier_mask = (df[col] < lower_bound) | (df[col] > upper_bound)
    n_outliers = outlier_mask.sum()
    
    if n_outliers > 0:
        outliers_found = True
        print(f"\n  {col}:")
        print(f"    Lower Bound: {lower_bound:,.0f}")
        print(f"    Upper Bound: {upper_bound:,.0f}")
        print(f"    Outliers Found: {n_outliers}")
        print(f"    Outlier Values:")
        for idx, val in df[outlier_mask][col].items():
            print(f"      Row {idx}: {val:,.0f}")

if not outliers_found:
    print("✓ No significant outliers detected using IQR method")

# ============================================================================
# STEP 7: KEY INSIGHTS & ANOMALIES
# ============================================================================
print("\n[STEP 7] KEY INSIGHTS & ANOMALIES...")
print("-" * 50)

# 7.1 Growth Analysis
print("\n7.1 Quarter-over-Quarter Growth:")
q_cols = ['Q1_Sales', 'Q2_Sales', 'Q3_Sales', 'Q4_Sales']
if all(col in df.columns for col in q_cols):
    total_by_quarter = df[q_cols].sum()
    print(f"\n  Total Sales by Quarter:")
    for q, val in total_by_quarter.items():
        print(f"    {q}: ${val:,.0f}")
    
    # Calculate growth rates
    print(f"\n  Quarter-over-Quarter Growth Rate:")
    for i in range(len(q_cols) - 1):
        current_q = total_by_quarter[q_cols[i]]
        next_q = total_by_quarter[q_cols[i+1]]
        growth = ((next_q - current_q) / current_q * 100)
        print(f"    {q_cols[i]} → {q_cols[i+1]}: {growth:+.1f}%")

# 7.2 Top Performers
print("\n7.2 Top Performers:")
print("-" * 50)
df['Total_Sales'] = df[q_cols].sum(axis=1)
top_products = df.nlargest(3, 'Total_Sales')[['Product', 'Total_Sales', 'Category', 'Region']]
print("\n  Top 3 Products by Total Sales:")
for idx, row in top_products.iterrows():
    print(f"    {row['Product']}: ${row['Total_Sales']:,.0f} ({row['Category']}, {row['Region']})")

# 7.3 Bottom Performers
print("\n7.3 Bottom Performers:")
print("-" * 50)
bottom_products = df.nsmallest(3, 'Total_Sales')[['Product', 'Total_Sales', 'Category', 'Region']]
print("\n  Bottom 3 Products by Total Sales:")
for idx, row in bottom_products.iterrows():
    print(f"    {row['Product']}: ${row['Total_Sales']:,.0f} ({row['Category']}, {row['Region']})")

# 7.4 Best Regions
print("\n7.4 Regional Performance:")
print("-" * 50)
region_totals = df.groupby('Region')['Total_Sales'].sum().sort_values(ascending=False)
print("\n  Total Sales by Region:")
for region, sales in region_totals.items():
    pct = (sales / region_totals.sum() * 100)
    print(f"    {region}: ${sales:,.0f} ({pct:.1f}%)")

# 7.5 Best Categories
print("\n7.5 Category Performance:")
print("-" * 50)
category_totals = df.groupby('Category')['Total_Sales'].sum().sort_values(ascending=False)
print("\n  Total Sales by Category:")
for category, sales in category_totals.items():
    pct = (sales / category_totals.sum() * 100)
    print(f"    {category}: ${sales:,.0f} ({pct:.1f}%)")

# ============================================================================
# STEP 8: DATA QUALITY SUMMARY
# ============================================================================
print("\n[STEP 8] DATA QUALITY SUMMARY...")
print("-" * 50)
print(f"✓ Total Records: {len(df)}")
print(f"✓ Total Fields: {len(df.columns)}")
print(f"✓ Missing Values: {df.isnull().sum().sum()}")
print(f"✓ Duplicate Records: 0")
print(f"✓ Data Completeness: 100%")
print(f"✓ Numeric Columns: {len(numeric_cols)}")
print(f"✓ Categorical Columns: {len(categorical_cols)}")

# ============================================================================
# STEP 9: SAVE ANALYSIS RESULTS
# ============================================================================
print("\n[STEP 9] SAVING ANALYSIS RESULTS...")
print("-" * 50)

# Save summary statistics to CSV
summary_stats.to_csv('eda_summary_statistics.csv')
print("✓ Saved: eda_summary_statistics.csv")

# Save category analysis
category_sales.to_csv('eda_category_analysis.csv')
print("✓ Saved: eda_category_analysis.csv")

# Save region analysis
region_sales.to_csv('eda_region_analysis.csv')
print("✓ Saved: eda_region_analysis.csv")

# Save insights to text file
with open('eda_insights.txt', 'w') as f:
    f.write("EXPLORATORY DATA ANALYSIS - KEY INSIGHTS\n")
    f.write("="*60 + "\n\n")
    
    f.write("1. DATA OVERVIEW\n")
    f.write("-"*60 + "\n")
    f.write(f"   Total Products: {len(df)}\n")
    f.write(f"   Total Sales: ${df['Total_Sales'].sum():,.0f}\n")
    f.write(f"   Average Product Sales: ${df['Total_Sales'].mean():,.0f}\n")
    f.write(f"   Time Period: Q1 - Q4\n\n")
    
    f.write("2. GROWTH TRENDS\n")
    f.write("-"*60 + "\n")
    for i in range(len(q_cols) - 1):
        current_q = total_by_quarter[q_cols[i]]
        next_q = total_by_quarter[q_cols[i+1]]
        growth = ((next_q - current_q) / current_q * 100)
        f.write(f"   {q_cols[i]} → {q_cols[i+1]}: {growth:+.1f}% growth\n")
    f.write("\n")
    
    f.write("3. TOP PERFORMERS\n")
    f.write("-"*60 + "\n")
    for idx, row in df.nlargest(5, 'Total_Sales').iterrows():
        f.write(f"   {row['Product']}: ${row['Total_Sales']:,.0f}\n")
    f.write("\n")
    
    f.write("4. REGIONAL INSIGHTS\n")
    f.write("-"*60 + "\n")
    for region, sales in region_totals.items():
        pct = (sales / region_totals.sum() * 100)
        f.write(f"   {region}: ${sales:,.0f} ({pct:.1f}%)\n")
    f.write("\n")
    
    f.write("5. CATEGORY INSIGHTS\n")
    f.write("-"*60 + "\n")
    for category, sales in category_totals.items():
        pct = (sales / category_totals.sum() * 100)
        f.write(f"   {category}: ${sales:,.0f} ({pct:.1f}%)\n")

print("✓ Saved: eda_insights.txt")

print("\n" + "="*80)
print("EDA ANALYSIS COMPLETE!")
print("="*80)
print("\nGenerated Files:")
print("  1. eda_summary_statistics.csv")
print("  2. eda_category_analysis.csv")
print("  3. eda_region_analysis.csv")
print("  4. eda_insights.txt")
print("\nNext Step: Run the dashboard with this analyzed data!")
print("="*80 + "\n")
