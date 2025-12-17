"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { clsx } from "clsx";
import {
  Calendar,
  Users,
  Star,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Check,
  ChevronRight,
  Camera,
  Clock,
  Wine,
  UtensilsCrossed,
  Play,
  CheckCircle,
  ArrowLeft,
  Upload,
  X,
} from "lucide-react";
import {
  useBriefing,
  useCompleteBriefing,
  useUploadAttendancePhoto,
} from "@/hooks/queries";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Modal } from "@/components/ui/Modal";

const STEPS = [
  { id: "overview", title: "Overview", icon: Calendar },
  { id: "vip", title: "VIP Guests", icon: Star },
  { id: "kitchen", title: "Kitchen Updates", icon: UtensilsCrossed },
  { id: "upsell", title: "Upsell Focus", icon: TrendingUp },
  { id: "training", title: "Training Topic", icon: BookOpen },
  { id: "attendance", title: "Attendance", icon: Users },
] as const;

export default function DailyBriefingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [attendance, setAttendance] = useState<string[]>([]);
  const [briefingComplete, setBriefingComplete] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Query hooks
  const { data: briefing, isLoading, error } = useBriefing();
  const completeBriefing = useCompleteBriefing();
  const uploadPhoto = useUploadAttendancePhoto();

  const toggleAttendance = useCallback((staffId: string) => {
    setAttendance((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  }, []);

  const handleCompleteBriefing = useCallback(async () => {
    if (!briefing) return;

    try {
      await completeBriefing.mutateAsync({
        briefingId: briefing.id,
        attendeeIds: attendance,
        photoUrl: uploadedPhotoUrl ?? undefined,
      });
      setBriefingComplete(true);
    } catch (err) {
      // Error will be shown via toast or inline error
      console.error("Failed to complete briefing:", err);
    }
  }, [briefing, attendance, uploadedPhotoUrl, completeBriefing]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const result = await uploadPhoto.mutateAsync(file);
        setUploadedPhotoUrl(result.url);
        setShowUploadModal(false);
      } catch (err) {
        console.error("Failed to upload photo:", err);
      }
    },
    [uploadPhoto]
  );

  // Handle keyboard navigation for steps
  const handleStepKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setCurrentStep(index);
      } else if (e.key === "ArrowRight" && index < STEPS.length - 1) {
        e.preventDefault();
        setCurrentStep(index + 1);
      } else if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        setCurrentStep(index - 1);
      }
    },
    []
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading briefing..." />
      </div>
    );
  }

  // Error state
  if (error || !briefing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-red-200 max-w-md w-full p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-2">
            Failed to load briefing
          </h2>
          <p className="text-slate-600 mb-4">
            {error?.message || "An unexpected error occurred"}
          </p>
          <Link
            href="/manager"
            className="inline-block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Completion state
  if (briefingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Briefing Complete!
          </h1>
          <p className="text-slate-600 mb-6">
            {attendance.length} of {briefing.teamOnShift.length} team members
            attended.
            <br />
            <span className="font-semibold text-emerald-600">
              {Math.round(
                (attendance.length / briefing.teamOnShift.length) * 100
              )}
              % adoption
            </span>
          </p>
          <div className="space-y-3">
            <Link
              href="/manager"
              className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Go to Manager Dashboard
            </Link>
            <Link
              href="/staff"
              className="block w-full py-3 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              Open Staff App
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const attendanceRate = briefing.teamOnShift.length > 0
    ? Math.round((attendance.length / briefing.teamOnShift.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/manager"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Back to manager dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" aria-hidden="true" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Daily Briefing</h1>
              <p className="text-sm text-slate-500">{briefing.dateFormatted}</p>
            </div>
          </div>
          <div className="flex items-center gap-2" aria-live="polite">
            <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span className="text-sm text-slate-600">
              ~{STEPS.length - currentStep} min remaining
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="h-1 bg-slate-100"
          role="progressbar"
          aria-valuenow={((currentStep + 1) / STEPS.length) * 100}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Briefing progress"
        >
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Step Indicators */}
      <nav
        className="bg-white border-b border-slate-100"
        aria-label="Briefing steps"
      >
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div
            className="flex items-center justify-between"
            role="tablist"
            aria-label="Briefing sections"
          >
            {STEPS.map((step, index) => (
              <button
                key={step.id}
                role="tab"
                aria-selected={index === currentStep}
                aria-controls={`panel-${step.id}`}
                id={`tab-${step.id}`}
                tabIndex={index === currentStep ? 0 : -1}
                onClick={() => setCurrentStep(index)}
                onKeyDown={(e) => handleStepKeyDown(e, index)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
                  index === currentStep
                    ? "bg-emerald-50 text-emerald-700"
                    : index < currentStep
                    ? "text-emerald-600"
                    : "text-slate-400"
                )}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <step.icon className="w-4 h-4" aria-hidden="true" />
                )}
                <span className="hidden md:inline">{step.title}</span>
                <span className="sr-only md:hidden">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Step 0: Overview */}
        {currentStep === 0 && (
          <div
            id="panel-overview"
            role="tabpanel"
            aria-labelledby="tab-overview"
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Today at a Glance
              </h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-700">
                    {briefing.reservations.total}
                  </p>
                  <p className="text-sm text-blue-600">Reservations</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-amber-700">
                    {briefing.vipGuests.length}
                  </p>
                  <p className="text-sm text-amber-600">VIP Tables</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-700">
                    {briefing.eightySixed.length}
                  </p>
                  <p className="text-sm text-red-600">86&apos;d Items</p>
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex-1 bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500">Lunch</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {briefing.reservations.lunch} covers
                  </p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500">Dinner</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {briefing.reservations.dinner} covers
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5" aria-hidden="true" />
                Today&apos;s Training Focus
              </h3>
              <p className="text-emerald-700 font-medium">
                {briefing.trainingTopic.title}
              </p>
              <p className="text-emerald-600 text-sm mt-1">
                {briefing.trainingTopic.description}
              </p>
            </div>
          </div>
        )}

        {/* Step 1: VIP Guests */}
        {currentStep === 1 && (
          <div
            id="panel-vip"
            role="tabpanel"
            aria-labelledby="tab-vip"
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
          >
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
              <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" aria-hidden="true" />
                VIP Guests Tonight
              </h2>
              <p className="text-sm text-amber-700 mt-1">
                Make sure to give these tables extra attention
              </p>
            </div>

            <ul className="divide-y divide-slate-100">
              {briefing.vipGuests.map((guest, index) => (
                <li key={index} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        {guest.name}
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                          Table {guest.table}
                        </span>
                      </h3>
                      <p className="text-slate-600 mt-1">{guest.notes}</p>
                    </div>
                    <Star
                      className="w-5 h-5 text-amber-400 fill-amber-400"
                      aria-hidden="true"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Step 2: Kitchen Updates */}
        {currentStep === 2 && (
          <div
            id="panel-kitchen"
            role="tabpanel"
            aria-labelledby="tab-kitchen"
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
                  86&apos;d Items
                </h2>
                <p className="text-sm text-red-700 mt-1">
                  These items are unavailable today
                </p>
              </div>

              <ul className="divide-y divide-slate-100">
                {briefing.eightySixed.map((item, index) => (
                  <li key={index} className="p-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-500" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.item}</h3>
                      <p className="text-sm text-slate-500">{item.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                Suggest Alternatives
              </h3>
              <p className="text-blue-700 text-sm">
                When guests ask for 86&apos;d items, suggest:
              </p>
              <ul className="mt-2 text-sm text-blue-600 space-y-1">
                {briefing.eightySixed.map((item, index) => (
                  <li key={index}>
                    &bull; {item.item} &rarr;{" "}
                    {item.alternatives?.join(" or ") || "Ask chef for alternatives"}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Step 3: Upsell Focus */}
        {currentStep === 3 && (
          <div
            id="panel-upsell"
            role="tabpanel"
            aria-labelledby="tab-upsell"
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-orange-500" aria-hidden="true" />
                  Food Upsells
                </h2>
              </div>

              <ul className="divide-y divide-slate-100">
                {briefing.upsellItems.food.map((item, index) => (
                  <li key={index} className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{item.item}</h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                        {item.margin} Margin
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wine className="w-5 h-5 text-purple-500" aria-hidden="true" />
                  Beverage Upsells
                </h2>
              </div>

              <ul className="divide-y divide-slate-100">
                {briefing.upsellItems.beverage.map((item, index) => (
                  <li key={index} className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{item.item}</h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                        {item.margin} Margin
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Step 4: Training Topic */}
        {currentStep === 4 && (
          <div
            id="panel-training"
            role="tabpanel"
            aria-labelledby="tab-training"
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                  {briefing.trainingTopic.title}
                </h2>
                <p className="text-sm text-emerald-700 mt-1">
                  Today&apos;s training focus
                </p>
              </div>

              <div className="p-6">
                <p className="text-slate-700 mb-6">
                  {briefing.trainingTopic.description}
                </p>

                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Related Behavior to Track:
                  </p>
                  <p className="text-emerald-700 font-semibold">
                    {briefing.trainingTopic.relatedBehavior}
                  </p>
                </div>

                <h3 className="font-semibold text-slate-900 mb-3">Key Tips:</h3>
                <ol className="space-y-3">
                  {briefing.trainingTopic.tips.map((tip, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-slate-700"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                        {index + 1}
                      </div>
                      {tip}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {briefing.trainingTopic.videoUrl && (
              <button
                type="button"
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`Play training video, ${briefing.trainingTopic.videoDuration || "2 min"}`}
              >
                <Play className="w-5 h-5" aria-hidden="true" />
                Play Training Video ({briefing.trainingTopic.videoDuration || "2 min"})
              </button>
            )}
          </div>
        )}

        {/* Step 5: Attendance */}
        {currentStep === 5 && (
          <div
            id="panel-attendance"
            role="tabpanel"
            aria-labelledby="tab-attendance"
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" aria-hidden="true" />
                  Team Attendance
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Tap each team member who attended the briefing
                </p>
              </div>

              <div
                className="divide-y divide-slate-100"
                role="group"
                aria-label="Team member attendance checkboxes"
              >
                {briefing.teamOnShift.map((member) => {
                  const isPresent = attendance.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      role="checkbox"
                      aria-checked={isPresent}
                      aria-label={`${member.name}, ${member.role}${isPresent ? ", present" : ""}`}
                      onClick={() => toggleAttendance(member.id)}
                      className={clsx(
                        "w-full p-4 flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500",
                        isPresent ? "bg-emerald-50" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
                            isPresent
                              ? "bg-emerald-200 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          )}
                          aria-hidden="true"
                        >
                          {member.avatar}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.role}</p>
                        </div>
                      </div>
                      <div
                        className={clsx(
                          "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                          isPresent
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-slate-300"
                        )}
                        aria-hidden="true"
                      >
                        {isPresent && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className={clsx(
                "w-full py-3 font-medium rounded-lg transition-colors flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500",
                uploadedPhotoUrl
                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              {uploadedPhotoUrl ? (
                <>
                  <CheckCircle className="w-5 h-5" aria-hidden="true" />
                  Photo Uploaded
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" aria-hidden="true" />
                  Upload Attendance Sheet Photo
                </>
              )}
            </button>

            <div
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center"
              aria-live="polite"
            >
              <p className="text-blue-700 font-medium">
                {attendance.length} of {briefing.teamOnShift.length} present
              </p>
              <p className="text-blue-600 text-sm">{attendanceRate}% attendance rate</p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-8 flex items-center justify-between" aria-label="Briefing navigation">
          <button
            type="button"
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
            className={clsx(
              "px-6 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
              currentStep === 0
                ? "invisible"
                : "text-slate-600 hover:bg-slate-100"
            )}
            aria-label="Go to previous step"
          >
            Back
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
              aria-label="Go to next step"
            >
              Continue
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteBriefing}
              disabled={attendance.length === 0 || completeBriefing.isPending}
              aria-busy={completeBriefing.isPending}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {completeBriefing.isPending ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Completing...</span>
                </>
              ) : (
                <>
                  Complete Briefing
                  <CheckCircle className="w-5 h-5" aria-hidden="true" />
                </>
              )}
            </button>
          )}
        </nav>
      </main>

      {/* Upload Modal using accessible Modal component */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Upload Attendance Sheet"
        description="Take a photo of your attendance sheet to keep a record"
        size="md"
        footer={
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhoto.isPending}
              aria-busy={uploadPhoto.isPending}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {uploadPhoto.isPending ? "Uploading..." : "Choose File"}
            </button>
          </div>
        }
      >
        <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
          <Camera className="w-12 h-12 text-slate-300 mx-auto mb-4" aria-hidden="true" />
          <p className="text-slate-600 mb-2">
            Take a photo of your attendance sheet
          </p>
          <p className="text-sm text-slate-400">JPG, PNG up to 10MB</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
            className="sr-only"
            aria-label="Upload attendance sheet photo"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPhoto.isPending}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors inline-flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {uploadPhoto.isPending ? (
              <>
                <LoadingSpinner size="sm" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" aria-hidden="true" />
                Select Photo
              </>
            )}
          </button>
        </div>

        {uploadPhoto.isError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Failed to upload photo. Please try again.
          </div>
        )}
      </Modal>
    </div>
  );
}
