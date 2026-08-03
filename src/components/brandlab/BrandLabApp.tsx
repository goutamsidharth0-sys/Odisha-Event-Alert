"use client";

import React from "react";
import UploadScreen from "./UploadScreen";
import AnalysisScreen from "./AnalysisScreen";
import IntentScreen from "./IntentScreen";
import KitScreen from "./KitScreen";
import ConvertScreen from "./ConvertScreen";
import { analyseLogo, type AnalysisOutput } from "@/lib/brandlab/analysis";
import { templatesForIntent } from "@/lib/brandlab/templates";
import { trackEventAction } from "@/lib/brandlab/actions";
import type { BrandArt } from "@/lib/brandlab/flatArt";
import type { BusinessCategory, Intent, Template } from "@/lib/brandlab/types";

// Five screens, mobile-first, no login until value is delivered.

type Screen = "upload" | "analysing" | "intent" | "kit" | "convert";

interface Answers {
  intent: Intent;
  businessCategory: BusinessCategory;
  selectedTemplates: string[];
}

export default function BrandLabApp() {
  const [screen, setScreen] = React.useState<Screen>("upload");
  const [businessName, setBusinessName] = React.useState("");
  const [analysis, setAnalysis] = React.useState<AnalysisOutput | null>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);
  const [answers, setAnswers] = React.useState<Answers | null>(null);
  const [svgSource, setSvgSource] = React.useState<string | undefined>();
  const [brandId, setBrandId] = React.useState<string | undefined>();

  const handleUpload = React.useCallback(async (file: File, name: string) => {
    setBusinessName(name);
    setAnalysis(null);
    setAnalysisError(null);
    setScreen("analysing");
    void trackEventAction("logo_uploaded", { type: file.type, size: file.size });

    // Keep the SVG source: it is what makes the print PDF genuinely vector.
    if (file.type === "image/svg+xml") {
      try {
        setSvgSource(await file.text());
      } catch {
        setSvgSource(undefined);
      }
    } else {
      setSvgSource(undefined);
    }

    try {
      const result = await analyseLogo(file);
      setAnalysis(result);
      void trackEventAction("analysis_complete", {
        orientation: result.orientation,
        backgroundRemoved: result.backgroundRemoved,
      });
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "We could not read that file. Please try another."
      );
    }
  }, []);

  const handleAnswers = React.useCallback((next: Answers) => {
    setAnswers(next);
    setScreen("kit");
    void trackEventAction("intent_answered", { ...next });
    void trackEventAction("gallery_viewed", { intent: next.intent });
  }, []);

  const art: BrandArt | null = React.useMemo(() => {
    if (!analysis || !answers) return null;
    return {
      businessName,
      palette: analysis.palette,
      // Data URL, not the object URL: the flat templates reference the logo from
      // inside an SVG, where blob: URLs cannot be fetched.
      logoUrl: analysis.processedDataUrl,
      logoReverseUrl: analysis.reverseDataUrl,
      logoAspect: analysis.aspect,
      businessCategory: answers.businessCategory,
    };
  }, [analysis, answers, businessName]);

  const templates: Template[] = React.useMemo(() => {
    if (!answers) return [];
    return templatesForIntent(answers.intent, answers.businessCategory, answers.selectedTemplates);
  }, [answers]);

  return (
    <div className="px-5 py-10 sm:px-8 sm:py-16">
      {screen === "upload" && <UploadScreen onSubmit={handleUpload} />}

      {screen === "analysing" && (
        <AnalysisScreen
          analysis={analysis}
          error={analysisError}
          onDone={() => setScreen("intent")}
          onRetry={() => {
            setAnalysisError(null);
            setScreen("upload");
          }}
        />
      )}

      {screen === "intent" && <IntentScreen onDone={handleAnswers} />}

      {screen === "kit" && art && (
        <KitScreen
          templates={templates}
          art={art}
          onContinue={() => setScreen("convert")}
          onEnlarge={(slug) => void trackEventAction("item_enlarged", { slug }, brandId)}
        />
      )}

      {screen === "convert" && art && analysis && answers && (
        <ConvertScreen
          art={art}
          templates={templates}
          intent={answers.intent}
          businessCategory={answers.businessCategory}
          orientation={analysis.orientation}
          logoCanvas={analysis.canvas}
          svgSource={svgSource}
          onConverted={({ brandId: id }) => setBrandId(id)}
        />
      )}
    </div>
  );
}
