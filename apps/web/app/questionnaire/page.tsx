"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { submitQuestionnaire } from "@/actions/questionnaire";
import { Check, ChevronLeft, ChevronRight, Building2, Users, TrendingUp, DollarSign, Target, AlertCircle } from "lucide-react";

type Industry = "RESTAURANT" | "RETAIL" | "HOSPITALITY" | "OTHER";
type EmployeeCount = "1-10" | "11-50" | "51-200" | "200+";

interface FormData {
  // Company info
  email: string;
  companyName: string;
  industry: Industry;
  employeeCount: EmployeeCount;
  // Responses
  revenueGrowth: number;
  revenueConcern: boolean;
  costIncrease: number;
  trackCostOfSales: boolean;
  teamContribution: number;
  retentionIssues: boolean;
  regularMeetings: boolean;
  existingRoles: string[];
}

interface ScoreResult {
  id: string;
  scores: {
    revenueHealth: number;
    costManagement: number;
    teamEngagement: number;
    overall: number;
    recommendations: string[];
  };
  message: string;
}

const ROLES_OPTIONS = [
  { id: "server", label: "Servers/Waitstaff" },
  { id: "host", label: "Host/Hostess" },
  { id: "bartender", label: "Bartenders" },
  { id: "chef", label: "Chef/Kitchen Staff" },
  { id: "purchaser", label: "Purchaser/Buyer" },
  { id: "accountant", label: "Accountant/Bookkeeper" },
  { id: "facilities", label: "Facilities/Maintenance" },
  { id: "manager", label: "Managers" },
];

const STEPS = [
  { id: 1, title: "Company Info", icon: Building2 },
  { id: 2, title: "Revenue Health", icon: TrendingUp },
  { id: 3, title: "Cost Management", icon: DollarSign },
  { id: 4, title: "Team Engagement", icon: Users },
  { id: 5, title: "Your Roles", icon: Target },
];

export default function QuestionnairePage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);

  const [formData, setFormData] = useState<FormData>({
    email: "",
    companyName: "",
    industry: "RESTAURANT",
    employeeCount: "11-50",
    revenueGrowth: 3,
    revenueConcern: false,
    costIncrease: 3,
    trackCostOfSales: false,
    teamContribution: 3,
    retentionIssues: false,
    regularMeetings: false,
    existingRoles: [],
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleRole = (roleId: string) => {
    setFormData((prev) => ({
      ...prev,
      existingRoles: prev.existingRoles.includes(roleId)
        ? prev.existingRoles.filter((r) => r !== roleId)
        : [...prev.existingRoles, roleId],
    }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.email && formData.companyName;
      case 2:
      case 3:
      case 4:
        return true;
      case 5:
        return formData.existingRoles.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitQuestionnaire({
        email: formData.email,
        companyName: formData.companyName,
        industry: formData.industry,
        employeeCount: formData.employeeCount,
        responses: {
          revenueGrowth: formData.revenueGrowth,
          revenueConcern: formData.revenueConcern,
          costIncrease: formData.costIncrease,
          trackCostOfSales: formData.trackCostOfSales,
          teamContribution: formData.teamContribution,
          retentionIssues: formData.retentionIssues,
          regularMeetings: formData.regularMeetings,
          existingRoles: formData.existingRoles,
        },
      });
      if (!result.success) throw new Error(result.error);
      setResult(result.data!);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit questionnaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show results page
  if (result) {
    return <ResultsPage result={result} companyName={formData.companyName} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="text-2xl font-bold text-white">
          Topline
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {STEPS.map((s, index) => (
                <div key={s.id} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      step > s.id
                        ? "bg-emerald-500 text-white"
                        : step === s.id
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-500/30"
                        : "bg-white/10 text-slate-400"
                    }`}
                  >
                    {step > s.id ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <s.icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`hidden sm:block w-16 lg:w-24 h-1 mx-2 transition-colors ${
                        step > s.id ? "bg-emerald-500" : "bg-white/10"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-slate-400 text-sm">
              Step {step} of 5: {STEPS[step - 1].title}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Step 1: Company Info */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-2">
                      Tell us about your business
                    </h2>
                    <p className="text-slate-400">
                      This helps us understand your specific needs.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => updateField("companyName", e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      placeholder="Your Restaurant Name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      placeholder="owner@company.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Industry
                      </label>
                      <select
                        value={formData.industry}
                        onChange={(e) => updateField("industry", e.target.value as Industry)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      >
                        <option value="RESTAURANT">Restaurant</option>
                        <option value="RETAIL">Retail</option>
                        <option value="HOSPITALITY">Hospitality</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Employee Count
                      </label>
                      <select
                        value={formData.employeeCount}
                        onChange={(e) =>
                          updateField("employeeCount", e.target.value as EmployeeCount)
                        }
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      >
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="200+">200+ employees</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Revenue Health */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-2">
                      Revenue Health
                    </h2>
                    <p className="text-slate-400">
                      Help us understand your revenue trends.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Over the last 3 years, has your revenue increased?
                    </label>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Decreased</span>
                      <span className="text-slate-400 text-sm">Significantly Increased</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateField("revenueGrowth", value)}
                          className={`flex-1 py-4 rounded-lg font-semibold transition-all ${
                            formData.revenueGrowth === value
                              ? "bg-emerald-600 text-white scale-105"
                              : "bg-white/5 text-slate-400 hover:bg-white/10"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Are you concerned about revenue growth?
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => updateField("revenueConcern", true)}
                        className={`py-4 rounded-lg font-semibold transition-all ${
                          formData.revenueConcern
                            ? "bg-amber-600 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        Yes, I&apos;m concerned
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("revenueConcern", false)}
                        className={`py-4 rounded-lg font-semibold transition-all ${
                          !formData.revenueConcern
                            ? "bg-emerald-600 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        No, things are good
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Cost Management */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-2">
                      Cost Management
                    </h2>
                    <p className="text-slate-400">
                      Tell us about your operating costs.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Have your operating costs increased over the last 3 years?
                    </label>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Decreased</span>
                      <span className="text-slate-400 text-sm">Significantly Increased</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateField("costIncrease", value)}
                          className={`flex-1 py-4 rounded-lg font-semibold transition-all ${
                            formData.costIncrease === value
                              ? "bg-emerald-600 text-white scale-105"
                              : "bg-white/5 text-slate-400 hover:bg-white/10"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Do you actively track your cost of sales?
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => updateField("trackCostOfSales", true)}
                        className={`py-4 rounded-lg font-semibold transition-all ${
                          formData.trackCostOfSales
                            ? "bg-emerald-600 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        Yes, we track it
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("trackCostOfSales", false)}
                        className={`py-4 rounded-lg font-semibold transition-all ${
                          !formData.trackCostOfSales
                            ? "bg-amber-600 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        No, not really
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Team Engagement */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-2">
                      Team Engagement
                    </h2>
                    <p className="text-slate-400">
                      How well does your team contribute to business goals?
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Do your team members actively contribute to company goals?
                    </label>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Rarely</span>
                      <span className="text-slate-400 text-sm">Always</span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateField("teamContribution", value)}
                          className={`flex-1 py-4 rounded-lg font-semibold transition-all ${
                            formData.teamContribution === value
                              ? "bg-emerald-600 text-white scale-105"
                              : "bg-white/5 text-slate-400 hover:bg-white/10"
                          }`}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Do you have trouble with staff retention?
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => updateField("retentionIssues", true)}
                        className={`py-4 rounded-lg font-semibold transition-all ${
                          formData.retentionIssues
                            ? "bg-amber-600 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        Yes, it&apos;s challenging
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("retentionIssues", false)}
                        className={`py-4 rounded-lg font-semibold transition-all ${
                          !formData.retentionIssues
                            ? "bg-emerald-600 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        No, team is stable
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Do you hold regular team meetings with training?
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => updateField("regularMeetings", true)}
                        className={`py-4 rounded-lg font-semibold transition-all ${
                          formData.regularMeetings
                            ? "bg-emerald-600 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        Yes, regularly
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("regularMeetings", false)}
                        className={`py-4 rounded-lg font-semibold transition-all ${
                          !formData.regularMeetings
                            ? "bg-amber-600 text-white"
                            : "bg-white/5 text-slate-400 hover:bg-white/10"
                        }`}
                      >
                        No, not consistently
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Roles */}
              {step === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-2">
                      Your Team Structure
                    </h2>
                    <p className="text-slate-400">
                      Select all the roles that exist in your organization.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {ROLES_OPTIONS.map((role) => (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className={`p-4 rounded-lg text-left font-medium transition-all ${
                          formData.existingRoles.includes(role.id)
                            ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              formData.existingRoles.includes(role.id)
                                ? "border-white bg-white"
                                : "border-slate-500"
                            }`}
                          >
                            {formData.existingRoles.includes(role.id) && (
                              <Check className="w-3 h-3 text-emerald-600" />
                            )}
                          </div>
                          {role.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                    step === 1
                      ? "invisible"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>

                {step < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                  >
                    Continue
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!canProceed() || isSubmitting}
                    className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Get Results
                        <ChevronRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Help text */}
          <p className="mt-6 text-center text-slate-500 text-sm">
            Your information is secure and will only be used to provide personalized recommendations.
          </p>
        </div>
      </main>
    </div>
  );
}

// Results Component
function ResultsPage({
  result,
  companyName,
}: {
  result: ScoreResult;
  companyName: string;
}) {
  const { scores } = result;

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 70) return "Strong";
    if (score >= 50) return "Moderate";
    return "Needs Attention";
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return "bg-emerald-500/20 border-emerald-500/30";
    if (score >= 50) return "bg-amber-500/20 border-amber-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="text-2xl font-bold text-white">
          Topline
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          {/* Results Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                <Check className="w-8 h-8 text-emerald-400" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Results for {companyName}
              </h1>
              <p className="text-slate-400">{result.message}</p>
            </div>

            {/* Overall Score */}
            <div className="text-center mb-8">
              <div
                className={`inline-flex flex-col items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreBg(
                  scores.overall
                )}`}
              >
                <span className={`text-4xl font-bold ${getScoreColor(scores.overall)}`}>
                  {scores.overall}
                </span>
                <span className="text-slate-400 text-sm">Overall Score</span>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <ScoreCard
                label="Revenue Health"
                score={scores.revenueHealth}
                description="Your revenue growth trends"
              />
              <ScoreCard
                label="Cost Management"
                score={scores.costManagement}
                description="How well you manage costs"
              />
              <ScoreCard
                label="Team Engagement"
                score={scores.teamEngagement}
                description="Team contribution & retention"
              />
            </div>

            {/* Recommendations */}
            {scores.recommendations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Recommendations
                </h3>
                <ul className="space-y-3">
                  {scores.recommendations.map((rec, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 p-4 bg-white/5 rounded-lg"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-400 text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <span className="text-slate-300">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="text-center space-y-4">
              <p className="text-slate-400">
                Ready to optimize your business with Topline?
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                >
                  Get Started
                </Link>
                <Link
                  href="/"
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-colors"
                >
                  View Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ScoreCard({
  label,
  score,
  description,
}: {
  label: string;
  score: number;
  description: string;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const getProgressColor = (score: number) => {
    if (score >= 70) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="p-4 bg-white/5 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-sm">{label}</span>
        <span className={`text-xl font-bold ${getScoreColor(score)}`}>{score}</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${getProgressColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-slate-500 text-xs">{description}</p>
    </div>
  );
}
