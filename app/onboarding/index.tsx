import React, { useCallback, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Button, Card, ErrorBox, Loading, NETWORK_ERROR } from "@/components/brand/ui";
import { Mascot } from "@/components/brand/Mascot";
import { AccountsStep } from "@/components/onboarding/AccountsStep";
import { FollowUpsStep } from "@/components/onboarding/FollowUpsStep";
import { InterviewStep } from "@/components/onboarding/InterviewStep";
import { MerchantsStep } from "@/components/onboarding/MerchantsStep";
import { StepHeader } from "@/components/onboarding/StepHeader";
import { colors, fonts } from "@/constants/Theme";
import { apiError, listAccounts, type Account } from "@/utils/activityApi";
import { firstUnanswered, nextFollowUp, stepNumber } from "@/utils/onboarding";
import { getFollowUps, getOnboarding, saveAnswers, type AnswersInput, type FollowUp, type OnboardingState, type Step } from "@/utils/onboardingApi";
import { isoDay } from "@/utils/plan";

/**
 * C5: onboarding (bb-server/docs/product/SPEC_ONBOARDING_PLAN.md §1–4, §8,
 * screens/Onboard-1…3): 1 accounts and import, 2 the coach's questions,
 * 3 a few uncertain merchants, 4 the draft plan (PL1/C6, not built yet).
 * Progress is saved on the server after every answer, so it resumes.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const [state, setState] = useState<OnboardingState | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [question, setQuestion] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ON2: the coach's follow-ups, once the five questions are answered (null: not shown).
  const [followUps, setFollowUps] = useState<FollowUp[] | null>(null);

  // Reload on focus: coming back from the Activity import screen updates step 1.
  const load = useCallback(async () => {
    try {
      const [s, list] = await Promise.all([getOnboarding(), listAccounts()]);
      setState(s);
      setAccounts(list);
      setError(null);
      // Resume inside the follow-ups if they were asked and aren't all answered.
      const answered = s.questions.every((q) => s.answers[q.id] !== undefined && s.answers[q.id] !== null);
      const saved = s.answers.follow_ups as Record<string, unknown> | undefined;
      if (s.step === "interview" && answered && s.follow_ups && nextFollowUp(s.follow_ups, saved) !== -1) setFollowUps(s.follow_ups);
    } catch {
      setError(NETWORK_ERROR);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const save = async (input: AnswersInput): Promise<boolean> => {
    setError(null);
    try {
      setState(await saveAnswers(input));
      return true;
    } catch (e) {
      const fields = apiError(e).fields;
      setError(fields ? Object.values(fields).flat().join(" ") : "Couldn't save that. Check your connection and try again.");
      return false;
    }
  };

  const goTo = async (step: Step) => {
    setBusy(true);
    await save({ step });
    setBusy(false);
  };

  // After question 5: ask for the follow-ups; none, or any error → straight on (spec §5).
  const afterQuestions = async () => {
    setBusy(true);
    let list: FollowUp[] = [];
    try {
      list = await getFollowUps();
    } catch {
      list = [];
    }
    setBusy(false);
    const saved = state?.answers.follow_ups as Record<string, unknown> | undefined;
    if (list.length > 0 && nextFollowUp(list, saved) !== -1) setFollowUps(list);
    else goTo("merchants");
  };

  const later = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));
  const step = state?.step ?? "accounts";
  const today = isoDay(new Date());

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <StepHeader
            step={stepNumber(step)}
            question={step === "interview" && state && !followUps ? { n: question + 1, of: state.questions.length } : undefined}
            onLater={later}
          />
          {error ? <ErrorBox message={error} onRetry={state ? undefined : load} /> : null}
          {!state && !error ? <Loading /> : null}

          {state && step === "accounts" ? (
            <AccountsStep
              accounts={accounts}
              canContinue={state.has_import}
              busy={busy}
              onUpload={(a) => router.push({ pathname: "/activity/import", params: { accountId: String(a.id) } })}
              onAddAccount={() => router.push("/activity/new-account")}
              onContinue={() => goTo("interview")}
            />
          ) : null}

          {state && step === "interview" && followUps ? (
            <FollowUpsStep
              followUps={followUps}
              start={Math.max(nextFollowUp(followUps, state.answers.follow_ups as Record<string, unknown> | undefined), 0)}
              onSave={save}
              onDone={() => {
                setFollowUps(null);
                goTo("merchants");
              }}
            />
          ) : null}

          {state && step === "interview" && !followUps ? (
            <InterviewStep
              questions={state.questions}
              detectedBills={state.facts?.likely_bills ?? []}
              answers={state.answers}
              start={firstUnanswered(state.questions, state.answers)}
              today={today}
              onSave={save}
              onIndex={setQuestion}
              onDone={afterQuestions}
            />
          ) : null}

          {state && step === "merchants" ? <MerchantsStep busy={busy} onContinue={() => goTo("plan")} /> : null}

          {state && (step === "plan" || step === "done") ? (
            <Card style={styles.plan}>
              <Mascot size={110} />
              <Text style={styles.planTitle} accessibilityRole="header">
                Your answers are saved
              </Text>
              <Text style={styles.planBody}>
                Next, your coach drafts a plan from your own numbers for you to approve. That step is coming soon; your answers will be used for it.
              </Text>
              <Button label="Go to Home" onPress={() => router.replace("/(tabs)")} />
            </Card>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.birch },
  flex: { flex: 1 },
  content: { padding: 20, gap: 18, paddingBottom: 48 },
  plan: { padding: 24, gap: 14, alignItems: "center" },
  planTitle: { fontFamily: fonts.heading, fontSize: 24, color: colors.bark, textAlign: "center" },
  planBody: { fontFamily: fonts.body, fontSize: 16, lineHeight: 23, color: colors.barkSecondary, textAlign: "center" },
});
