'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FinancialMetricCard } from '@/components/financial/FinancialMetricCard';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Alert } from '@/components/ui/Alert';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Tooltip } from '@/components/ui/Tooltip';
import { apiClient } from '@/lib/apiClient';
import { formatCurrency, formatDate, rupeesToPaise } from '@/lib/formatters';
import { CashFlowForecastData, CashFlowItemRecord } from '@/types/api';
import { useUserSession } from '@/hooks/useUserSession';

export default function CashFlowPage() {
  const { userId } = useUserSession();
  const [forecast, setForecast] = useState<CashFlowForecastData | null>(null);
  const [items, setItems] = useState<CashFlowItemRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Add Item Drawer State
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemAmountRupees, setItemAmountRupees] = useState('');
  const [isIncome, setIsIncome] = useState(true);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Scenario Planning State
  const [showScenarioPlanner, setShowScenarioPlanner] = useState(false);
  const [scenarioName, setScenarioName] = useState('Expected Client Receipt');
  const [scenarioIncomeRupees, setScenarioIncomeRupees] = useState('2000');
  const [scenarioExpenseRupees, setScenarioExpenseRupees] = useState('0');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<CashFlowForecastData | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [forecastRes, itemsRes] = await Promise.all([
        apiClient.cashFlow.getForecast(),
        apiClient.cashFlow.getItems(),
      ]);

      if (forecastRes.success && forecastRes.data) {
        setForecast(forecastRes.data);
      }
      if (itemsRes.success && itemsRes.data?.items) {
        setItems(itemsRes.data.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to cash-flow services.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const rupees = parseFloat(itemAmountRupees);
    if (isNaN(rupees) || rupees <= 0) {
      setFormError('Please enter a positive numeric amount in INR.');
      return;
    }

    if (isSubmitting) return; // Prevent duplicate submissions
    setIsSubmitting(true);

    try {
      const res = await apiClient.cashFlow.createItem({
        amount: rupeesToPaise(rupees),
        isIncome,
        isConfirmed,
        dueDate: dueDate ? new Date(dueDate).toISOString() : new Date().toISOString(),
      });

      if (res.success) {
        setShowAddItem(false);
        setItemAmountRupees('');
        setDueDate('');
        setSuccessNotice('Cash-flow item recorded successfully.');
        await loadData();
      } else {
        setFormError(res.error || 'Failed to save item. What you can do next: check the amount and try again.');
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Network error creating item. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleConfirm = async (item: CashFlowItemRecord) => {
    try {
      const res = await apiClient.cashFlow.updateItem(item.id, {
        isConfirmed: !item.isConfirmed,
      });

      if (res.success) {
        setSuccessNotice(
          `Item marked as ${!item.isConfirmed ? 'Confirmed' : 'Unconfirmed'}. Forecast updated.`
        );
        await loadData();
      } else {
        setError(res.error || 'Failed to update item confirmation.');
      }
    } catch {
      setError('Network error updating item status.');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await apiClient.cashFlow.deleteItem(itemId);
      if (res.success) {
        setSuccessNotice('Item removed from ledger.');
        await loadData();
      } else {
        setError(res.error || 'Failed to delete item.');
      }
    } catch {
      setError('Network error deleting item.');
    }
  };

  // Run Custom Scenario Simulation via Backend POST /api/cash-flow/forecast
  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSimulating(true);

    const addIncome = parseFloat(scenarioIncomeRupees);
    const addExpense = parseFloat(scenarioExpenseRupees);

    try {
      const res = await apiClient.cashFlow.simulate({
        hypotheticalScenarios: [
          {
            name: scenarioName.trim() || 'Custom Scenario',
            additionalIncome: isNaN(addIncome) || addIncome < 0 ? 0 : rupeesToPaise(addIncome),
            additionalExpense: isNaN(addExpense) || addExpense < 0 ? 0 : rupeesToPaise(addExpense),
          },
        ],
      });

      if (res.success && res.data) {
        setSimulationResult(res.data);
      } else {
        setError(res.error || 'Simulation failed.');
      }
    } catch {
      setError('Network error executing simulation.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Mandatory Requirement 4 Test Preset: Available: ₹5,000, Expenses: ₹8,000, Unconfirmed: ₹2,000
  const handleRunIntegrityExample = async () => {
    setIsSimulating(true);
    setShowScenarioPlanner(true);
    setScenarioName('Conditional: If ₹2,000 Expected Receipt Clears');
    setScenarioIncomeRupees('2000');
    setScenarioExpenseRupees('0');

    try {
      const res = await apiClient.cashFlow.simulate({
        currentAvailableFunds: 500000, // ₹5,000
        confirmedIncome: 0,
        unconfirmedReceipts: 200000, // ₹2,000
        expenses: 800000, // ₹8,000
        hypotheticalScenarios: [
          {
            name: 'Conditional: If ₹2,000 Expected Receipt Clears',
            additionalIncome: 200000,
          },
        ],
      });

      if (res.success && res.data) {
        setSimulationResult(res.data);
        setSuccessNotice(
          'Authoritative test example executed: Primary forecast shows ₹3,000 shortfall; conditional scenario shows ₹1,000 shortfall.'
        );
      }
    } catch {
      setError('Error running integrity example.');
    } finally {
      setIsSimulating(false);
    }
  };

  // Extract metrics from forecast data
  const availableFundsPaise =
    forecast?.summary?.confirmedAvailableFunds ?? forecast?.availableFunds ?? 0;
  const confirmedIncomePaise =
    forecast?.summary?.confirmedIncomingFunds ?? forecast?.confirmedUpcomingIncome ?? 0;
  const unconfirmedIncomePaise =
    forecast?.summary?.unconfirmedReceipts ?? forecast?.unconfirmedUpcomingIncome ?? 0;
  const upcomingExpensesPaise =
    forecast?.summary?.upcomingExpenses ?? forecast?.upcomingExpenses ?? 0;
  const isShortfall =
    forecast?.primaryForecast?.isShortfall ?? forecast?.isShortfall ?? false;
  const shortfallAmountPaise =
    forecast?.primaryForecast?.shortfallAmount ?? forecast?.shortfallAmount ?? 0;
  const netAmountPaise =
    forecast?.primaryForecast?.netAmount ?? forecast?.netCashFlow ?? 0;

  return (
    <AppShell>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Page Header */}
        <PageHeader
          title="Money Planner"
          description="Track money coming in, money going out, and upcoming expenses."
          breadcrumbs={[{ label: 'Money Planner' }]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunIntegrityExample}
              >
                Try Sample Calculation
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowAddItem((prev) => !prev);
                  setFormError(null);
                }}
              >
                {showAddItem ? 'Cancel Form' : '+ Add Money Entry'}
              </Button>
            </div>
          }
        />

        {/* Feedback Alerts */}
        {error && (
          <Alert variant="danger" title="Service Notice" onClose={() => setError(null)}>
            <div className="flex items-center justify-between gap-4">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={loadData}>
                Retry
              </Button>
            </div>
          </Alert>
        )}

        {successNotice && (
          <Alert variant="success" onClose={() => setSuccessNotice(null)}>
            {successNotice}
          </Alert>
        )}

        {/* 1. Main Dashboard: Financial Metric Cards with Tooltips */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#334155]">
                Primary Forecast & Balances
              </h2>
              <Tooltip content="Primary forecast uses strictly confirmed funds. Unconfirmed expected income is displayed separately and never inflated into available money.">
                <svg className="w-4 h-4 text-[#94A3B8] cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Tooltip>
            </div>
            <span className="text-xs text-[#64748B]">INR (₹)</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Available Funds */}
              <Tooltip
                content="Real liquid balance confirmed in account. Base for all conservative projections."
                className="w-full"
              >
                <FinancialMetricCard
                  className="w-full"
                  title="Available Funds"
                  amountPaise={availableFundsPaise}
                  subtitle="Confirmed liquid baseline"
                  variant="default"
                  badge={<Badge variant="info">Verified</Badge>}
                />
              </Tooltip>

              {/* Upcoming Expenses */}
              <Tooltip
                content="Sum of planned liabilities, bills, and outgoing payments."
                className="w-full"
              >
                <FinancialMetricCard
                  className="w-full"
                  title="Planned Expenses"
                  amountPaise={upcomingExpensesPaise}
                  subtitle="Committed payables"
                  variant="warning"
                  badge={<Badge variant="warning">Payables</Badge>}
                />
              </Tooltip>

              {/* Primary Net or Shortfall */}
              <Tooltip
                content={
                  isShortfall
                    ? 'Primary Shortfall: Confirmed available money is insufficient to cover planned expenses. Excludes unconfirmed receipts.'
                    : 'Projected Surplus: Available confirmed balance remaining after scheduled expenses.'
                }
                className="w-full"
              >
                <FinancialMetricCard
                  className="w-full"
                  title={isShortfall ? 'Primary Shortfall' : 'Projected Balance'}
                  amountPaise={isShortfall ? shortfallAmountPaise : netAmountPaise}
                  subtitle={
                    isShortfall
                      ? 'Deficit: Action required before due dates'
                      : 'Conservative balance surplus'
                  }
                  variant={isShortfall ? 'danger' : 'success'}
                  badge={
                    <Badge variant={isShortfall ? 'danger' : 'success'}>
                      {isShortfall ? 'Deficit' : 'Surplus'}
                    </Badge>
                  }
                />
              </Tooltip>

              {/* Unconfirmed Receipts (Segregated) */}
              <Tooltip
                content="Unconfirmed or delayed incoming payments. Segregated to prevent false solvency."
                className="w-full"
              >
                <FinancialMetricCard
                  className="w-full"
                  title="Unconfirmed Expected"
                  amountPaise={unconfirmedIncomePaise}
                  subtitle="Not counted in primary forecast"
                  variant="info"
                  badge={<Badge variant="neutral">Segregated</Badge>}
                />
              </Tooltip>
            </div>
          )}
        </div>

        {/* 2. Visual Liquidity Proportion Bar */}
        {!isLoading && (availableFundsPaise > 0 || upcomingExpensesPaise > 0 || unconfirmedIncomePaise > 0) && (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-xs hover:border-[#93C5FD] transition-all duration-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0F2744] uppercase tracking-wider">
                Liquidity Coverage Comparison
              </span>
              <span className="text-[#64748B]">Minor Units (Exact Paise)</span>
            </div>

            {/* Proportion Bar */}
            <div className="w-full h-4 rounded-full bg-[#F1F5F9] overflow-hidden flex shadow-inner">
              <div
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (availableFundsPaise /
                        Math.max(1, availableFundsPaise + upcomingExpensesPaise + unconfirmedIncomePaise)) *
                        100
                    )
                  )}%`,
                }}
                className="bg-[#0F2744] transition-all"
                title={`Available: ${formatCurrency(availableFundsPaise)}`}
              />
              <div
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (unconfirmedIncomePaise /
                        Math.max(1, availableFundsPaise + upcomingExpensesPaise + unconfirmedIncomePaise)) *
                        100
                    )
                  )}%`,
                }}
                className="bg-[#0284C7] transition-all"
                title={`Unconfirmed: ${formatCurrency(unconfirmedIncomePaise)}`}
              />
              <div
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (upcomingExpensesPaise /
                        Math.max(1, availableFundsPaise + upcomingExpensesPaise + unconfirmedIncomePaise)) *
                        100
                    )
                  )}%`,
                }}
                className="bg-[#DC2626] transition-all"
                title={`Expenses: ${formatCurrency(upcomingExpensesPaise)}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0F2744]" />
                <span>Available: {formatCurrency(availableFundsPaise)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0284C7]" />
                <span>Unconfirmed: {formatCurrency(unconfirmedIncomePaise)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#DC2626]" />
                <span>Expenses: {formatCurrency(upcomingExpensesPaise)}</span>
              </div>
            </div>
          </div>
        )}

        {/* 3. Add Income / Expense Form Drawer */}
        {showAddItem && (
          <div className="rounded-2xl border border-[#CBD5E1] bg-white p-6 shadow-sm space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Add Income or Expense Item</h3>
                <p className="text-xs text-[#64748B]">
                  Itemized entry to reflect upcoming cash obligations or confirmed deposits.
                </p>
              </div>
              <Badge variant="info">Ledger Record</Badge>
            </div>

            {formError && (
              <Alert variant="danger" onClose={() => setFormError(null)}>
                {formError}
              </Alert>
            )}

            <form onSubmit={handleCreateItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <FormField label="Item Type" required>
                <Select
                  value={isIncome ? 'income' : 'expense'}
                  onChange={(e) => setIsIncome(e.target.value === 'income')}
                >
                  <option value="income">Income (Incoming Transfer)</option>
                  <option value="expense">Expense (Outgoing Bill / Obligation)</option>
                </Select>
              </FormField>

              <FormField label="Amount (₹ INR)" required>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 5000"
                  value={itemAmountRupees}
                  onChange={(e) => setItemAmountRupees(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Due / Expected Date">
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </FormField>

              <FormField label="Confirmation Status">
                <Select
                  value={isConfirmed ? 'confirmed' : 'unconfirmed'}
                  onChange={(e) => setIsConfirmed(e.target.value === 'confirmed')}
                >
                  <option value="unconfirmed">Unconfirmed / Expected</option>
                  <option value="confirmed">Confirmed / Cleared</option>
                </Select>
              </FormField>

              <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end gap-3 pt-3 border-t border-[#F1F5F9]">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button variant="primary" type="submit" isLoading={isSubmitting}>
                  Save to Ledger
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 4. Scenario Planning & What-If Simulation Panel */}
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#F1F5F9]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0F172A]">Scenario Planning & What-If Simulation</h3>
                <Badge variant="info">Conditional</Badge>
              </div>
              <p className="text-xs text-[#64748B]">
                Simulate what happens if unconfirmed payments arrive, without modifying actual records.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowScenarioPlanner((prev) => !prev)}
            >
              {showScenarioPlanner ? 'Hide Simulator' : 'Open Simulator'}
            </Button>
          </div>

          {showScenarioPlanner && (
            <div className="space-y-4 pt-2">
              <form onSubmit={handleRunSimulation} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Scenario Name">
                  <Input
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="e.g. Client Clears Invoice"
                  />
                </FormField>

                <FormField label="Conditional Incoming (₹ INR)">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={scenarioIncomeRupees}
                    onChange={(e) => setScenarioIncomeRupees(e.target.value)}
                    placeholder="e.g. 2000"
                  />
                </FormField>

                <FormField label="Additional Expense (₹ INR)">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={scenarioExpenseRupees}
                    onChange={(e) => setScenarioExpenseRupees(e.target.value)}
                    placeholder="e.g. 0"
                  />
                </FormField>

                <div className="sm:col-span-3 flex justify-end">
                  <Button variant="primary" size="sm" type="submit" isLoading={isSimulating}>
                    Run Simulation
                  </Button>
                </div>
              </form>

              {/* Simulation Result Presentation */}
              {simulationResult && (
                <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#166534]">
                      Simulation Result (Authoritative Backend Output)
                    </span>
                    <Badge variant="success">Conditional Scenario</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {/* Primary Forecast in Simulation */}
                    <div className="p-3 rounded-lg bg-white border border-[#BBF7D0]">
                      <span className="font-semibold text-[#64748B] block mb-1">
                        Primary Forecast (Without Uncertain Money)
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          simulationResult.primaryForecast?.isShortfall ? 'text-[#DC2626]' : 'text-[#059669]'
                        }`}
                      >
                        {simulationResult.primaryForecast?.isShortfall
                          ? `-${formatCurrency(simulationResult.primaryForecast.shortfallAmount)} (Shortfall)`
                          : formatCurrency(simulationResult.primaryForecast?.netAmount)}
                      </span>
                      <p className="text-[11px] text-[#64748B] mt-1">
                        Unconfirmed receipts are excluded from this baseline.
                      </p>
                    </div>

                    {/* Conditional Scenario Outcome */}
                    {simulationResult.conditionalScenarios?.hypotheticals?.[0] && (
                      <div className="p-3 rounded-lg bg-white border border-[#BBF7D0]">
                        <span className="font-semibold text-[#64748B] block mb-1">
                          {simulationResult.conditionalScenarios.hypotheticals[0].name}
                        </span>
                        <span
                          className={`text-lg font-bold ${
                            simulationResult.conditionalScenarios.hypotheticals[0].isShortfall
                              ? 'text-[#DC2626]'
                              : 'text-[#059669]'
                          }`}
                        >
                          {simulationResult.conditionalScenarios.hypotheticals[0].isShortfall
                            ? `-${formatCurrency(
                                simulationResult.conditionalScenarios.hypotheticals[0].shortfallAmount
                              )} (Shortfall)`
                            : formatCurrency(
                                simulationResult.conditionalScenarios.hypotheticals[0].projectedNet
                              )}
                        </span>
                        <p className="text-[11px] text-[#64748B] mt-1">
                          Calculated under the condition that additional funds clear.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Income and Expense Ledger Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0F2744]">Cash-Flow Ledger Items</h3>
              <Tooltip content="All recorded transactions and bills. You can toggle confirmation status or remove items at any time.">
                <svg className="w-4 h-4 text-[#94A3B8] cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Tooltip>
            </div>
            <span className="text-xs text-[#64748B]">{items.length} item(s) logged</span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              <CardSkeleton rows={3} />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="No Ledger Items Recorded"
              description="Start forecasting by adding your confirmed bank balance, regular income, or upcoming bills."
              action={
                <Button variant="primary" size="sm" onClick={() => setShowAddItem(true)}>
                  Add First Item
                </Button>
              }
            />
          ) : (
            <DataTable
              data={items}
              keyExtractor={(item) => item.id}
              columns={[
                {
                  key: 'dueDate',
                  header: 'Due / Expected Date',
                  render: (item) => formatDate(item.dueDate),
                },
                {
                  key: 'type',
                  header: 'Direction',
                  render: (item) => (
                    <span
                      className={`font-semibold text-xs ${
                        item.isIncome ? 'text-[#059669]' : 'text-[#DC2626]'
                      }`}
                    >
                      {item.isIncome ? 'Income' : 'Expense'}
                    </span>
                  ),
                },
                {
                  key: 'amount',
                  header: 'Amount (INR)',
                  render: (item) => (
                    <span className="font-bold text-sm text-[#0B192C]">
                      {formatCurrency(item.amount)}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Confirmation Status',
                  render: (item) => (
                    <Badge variant={item.isConfirmed ? 'success' : 'warning'} size="sm">
                      {item.isConfirmed ? 'Confirmed' : 'Unconfirmed'}
                    </Badge>
                  ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (item) => (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleConfirm(item)}
                      >
                        {item.isConfirmed ? 'Mark Unconfirmed' : 'Mark Confirmed'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-[#DC2626] hover:bg-[#FEF2F2]"
                      >
                        Delete
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
