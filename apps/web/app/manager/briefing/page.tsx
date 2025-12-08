"use client";

import { useState } from "react";
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
} from "lucide-react";

// Mock data for demonstration
const MOCK_BRIEFING = {
  date: new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }),
  reservations: {
    total: 47,
    lunch: 12,
    dinner: 35,
  },
  vipGuests: [
    { name: "Johnson Party", table: "12", notes: "Anniversary dinner, bring champagne" },
    { name: "Mayor Williams", table: "VIP 1", notes: "Business meeting, quiet table" },
    { name: "Regular - Smith", table: "8", notes: "Usual order: Old Fashioned" },
  ],
  eightySixed: [
    { item: "Salmon", reason: "Delivery delayed until tomorrow" },
    { item: "Chocolate Lava Cake", reason: "Sold out" },
  ],
  upsellItems: {
    food: [
      { item: "Wagyu Ribeye", margin: "High", description: "Fresh delivery today, feature special" },
      { item: "Truffle Risotto", margin: "High", description: "Chef's recommendation" },
    ],
    beverage: [
      { item: "Reserve Cabernet 2018", margin: "High", description: "Pairs with ribeye" },
      { item: "Aperol Spritz", margin: "Medium", description: "Happy hour push" },
    ],
  },
  trainingTopic: {
    title: "Wine Pairing Basics",
    description:
      "Focus on suggesting wine pairings with entrees. Every table should be offered a wine suggestion.",
    relatedBehavior: "Suggest Wine Pairing",
    tips: [
      "Ask about preferences: red, white, or bubbly?",
      "Mention 2-3 options in different price ranges",
      "Describe flavor profiles, not just grape varieties",
    ],
  },
  teamOnShift: [
    { id: "1", name: "Sarah Miller", role: "Server", avatar: "SM" },
    { id: "2", name: "Mike Johnson", role: "Server", avatar: "MJ" },
    { id: "3", name: "Emily Chen", role: "Server", avatar: "EC" },
    { id: "4", name: "James Wilson", role: "Bartender", avatar: "JW" },
    { id: "5", name: "Lisa Park", role: "Server", avatar: "LP" },
    { id: "6", name: "Tom Brown", role: "Host", avatar: "TB" },
  ],
};

export default function DailyBriefingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [attendance, setAttendance] = useState<string[]>([]);
  const [briefingComplete, setBriefingComplete] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const steps = [
    { id: "overview", title: "Overview", icon: Calendar },
    { id: "vip", title: "VIP Guests", icon: Star },
    { id: "kitchen", title: "Kitchen Updates", icon: UtensilsCrossed },
    { id: "upsell", title: "Upsell Focus", icon: TrendingUp },
    { id: "training", title: "Training Topic", icon: BookOpen },
    { id: "attendance", title: "Attendance", icon: Users },
  ];

  const toggleAttendance = (staffId: string) => {
    setAttendance((prev) =>
      prev.includes(staffId)
        ? prev.filter((id) => id !== staffId)
        : [...prev, staffId]
    );
  };

  const handleCompleteBriefing = () => {
    setBriefingComplete(true);
  };

  if (briefingComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Briefing Complete!
          </h1>
          <p className="text-slate-600 mb-6">
            {attendance.length} of {MOCK_BRIEFING.teamOnShift.length} team
            members attended.
            <br />
            <span className="font-semibold text-emerald-600">
              {Math.round(
                (attendance.length / MOCK_BRIEFING.teamOnShift.length) * 100
              )}
              % adoption
            </span>
          </p>
          <div className="space-y-3">
            <Link
              href="/manager"
              className="block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
            >
              Go to Manager Dashboard
            </Link>
            <Link
              href="/staff"
              className="block w-full py-3 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Open Staff App
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/manager"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Daily Briefing</h1>
              <p className="text-sm text-slate-500">{MOCK_BRIEFING.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">
              ~{steps.length - currentStep} min remaining
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Step Indicators */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={clsx(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  index === currentStep
                    ? "bg-emerald-50 text-emerald-700"
                    : index < currentStep
                    ? "text-emerald-600"
                    : "text-slate-400"
                )}
              >
                {index < currentStep ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
                <span className="hidden md:inline">{step.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6">
        {/* Step 0: Overview */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                Today at a Glance
              </h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-blue-700">
                    {MOCK_BRIEFING.reservations.total}
                  </p>
                  <p className="text-sm text-blue-600">Reservations</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-amber-700">
                    {MOCK_BRIEFING.vipGuests.length}
                  </p>
                  <p className="text-sm text-amber-600">VIP Tables</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-red-700">
                    {MOCK_BRIEFING.eightySixed.length}
                  </p>
                  <p className="text-sm text-red-600">86&apos;d Items</p>
                </div>
              </div>

              <div className="flex gap-4 text-sm">
                <div className="flex-1 bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500">Lunch</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {MOCK_BRIEFING.reservations.lunch} covers
                  </p>
                </div>
                <div className="flex-1 bg-slate-50 rounded-lg p-3">
                  <p className="text-slate-500">Dinner</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {MOCK_BRIEFING.reservations.dinner} covers
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
              <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Today&apos;s Training Focus
              </h3>
              <p className="text-emerald-700 font-medium">
                {MOCK_BRIEFING.trainingTopic.title}
              </p>
              <p className="text-emerald-600 text-sm mt-1">
                {MOCK_BRIEFING.trainingTopic.description}
              </p>
            </div>
          </div>
        )}

        {/* Step 1: VIP Guests */}
        {currentStep === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-100">
              <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                VIP Guests Tonight
              </h2>
              <p className="text-sm text-amber-700 mt-1">
                Make sure to give these tables extra attention
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {MOCK_BRIEFING.vipGuests.map((guest, index) => (
                <div key={index} className="p-6">
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
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Kitchen Updates */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-red-50 px-6 py-4 border-b border-red-100">
                <h2 className="text-lg font-bold text-red-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  86&apos;d Items
                </h2>
                <p className="text-sm text-red-700 mt-1">
                  These items are unavailable today
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {MOCK_BRIEFING.eightySixed.map((item, index) => (
                  <div key={index} className="p-6 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{item.item}</h3>
                      <p className="text-sm text-slate-500">{item.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                Suggest Alternatives
              </h3>
              <p className="text-blue-700 text-sm">
                When guests ask for 86&apos;d items, suggest:
              </p>
              <ul className="mt-2 text-sm text-blue-600 space-y-1">
                <li>
                  &bull; Salmon → Try the Branzino (similar preparation)
                </li>
                <li>
                  &bull; Chocolate Lava Cake → Tiramisu or Crème Brûlée
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 3: Upsell Focus */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-orange-500" />
                  Food Upsells
                </h2>
              </div>

              <div className="divide-y divide-slate-100">
                {MOCK_BRIEFING.upsellItems.food.map((item, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{item.item}</h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                        {item.margin} Margin
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Wine className="w-5 h-5 text-purple-500" />
                  Beverage Upsells
                </h2>
              </div>

              <div className="divide-y divide-slate-100">
                {MOCK_BRIEFING.upsellItems.beverage.map((item, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-900">{item.item}</h3>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                        {item.margin} Margin
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Training Topic */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-emerald-50 px-6 py-4 border-b border-emerald-100">
                <h2 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  {MOCK_BRIEFING.trainingTopic.title}
                </h2>
                <p className="text-sm text-emerald-700 mt-1">
                  Today&apos;s training focus
                </p>
              </div>

              <div className="p-6">
                <p className="text-slate-700 mb-6">
                  {MOCK_BRIEFING.trainingTopic.description}
                </p>

                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Related Behavior to Track:
                  </p>
                  <p className="text-emerald-700 font-semibold">
                    {MOCK_BRIEFING.trainingTopic.relatedBehavior}
                  </p>
                </div>

                <h3 className="font-semibold text-slate-900 mb-3">Key Tips:</h3>
                <ul className="space-y-3">
                  {MOCK_BRIEFING.trainingTopic.tips.map((tip, index) => (
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
                </ul>
              </div>
            </div>

            <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Play Training Video (2 min)
            </button>
          </div>
        )}

        {/* Step 5: Attendance */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Team Attendance
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Tap each team member who attended the briefing
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                {MOCK_BRIEFING.teamOnShift.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => toggleAttendance(member.id)}
                    className={clsx(
                      "w-full p-4 flex items-center justify-between transition-colors",
                      attendance.includes(member.id)
                        ? "bg-emerald-50"
                        : "hover:bg-slate-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={clsx(
                          "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
                          attendance.includes(member.id)
                            ? "bg-emerald-200 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        )}
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
                        attendance.includes(member.id)
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-300"
                      )}
                    >
                      {attendance.includes(member.id) && (
                        <Check className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Upload Attendance Sheet Photo
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-blue-700 font-medium">
                {attendance.length} of {MOCK_BRIEFING.teamOnShift.length} present
              </p>
              <p className="text-blue-600 text-sm">
                {Math.round(
                  (attendance.length / MOCK_BRIEFING.teamOnShift.length) * 100
                )}
                % attendance rate
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            className={clsx(
              "px-6 py-3 rounded-lg font-medium transition-colors",
              currentStep === 0
                ? "invisible"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            Back
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleCompleteBriefing}
              disabled={attendance.length === 0}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 text-white font-semibold rounded-lg transition-colors"
            >
              Complete Briefing
              <CheckCircle className="w-5 h-5" />
            </button>
          )}
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Upload Attendance Sheet
            </h2>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
              <Camera className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">
                Take a photo of your attendance sheet
              </p>
              <p className="text-sm text-slate-400">
                JPG, PNG up to 10MB
              </p>
              <button className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">
                Choose File
              </button>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
