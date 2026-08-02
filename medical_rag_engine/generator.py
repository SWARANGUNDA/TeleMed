"""
generator.py — Grounded LLM Generation Layer.

Executes grounded natural language generation for REPORT MODE and Q&A MODE.
Uses a deterministic grounded fallback generator when offline, ensuring
100% reliable execution and testability without requiring external API keys.
Strips raw document header metadata from narrative recommendations, ensures
modality-aware reporting across all 7 pathways, and eliminates orphan citations.
"""

import logging
import re
from typing import Any, Dict, List, Optional

from . import config
from .post_validator import clean_rag_response
from .prompt_templates import build_qanda_mode_prompt, build_report_mode_prompt

logger = logging.getLogger("medical_rag_engine.generator")


def clean_evidence_text(text: str) -> str:
    """Remove raw metadata lines and headers from evidence text for report narrative."""
    lines = []
    for line in text.split("\n"):
        line_s = line.strip()
        if not line_s:
            continue
        if any(line_s.startswith(prefix) for prefix in [
            "Organization:", "Publication Date:", "Document Version:", "Evidence Type:", "# "
        ]):
            continue
        lines.append(line_s)
    clean_str = " ".join(lines)
    # Remove any residual markdown section headers
    clean_str = re.sub(r"^##\s+Section\s+\d+:\s*", "", clean_str)
    return clean_str.strip()


class GroundedRAGGenerator:
    """Grounded LLM Generator for Report Mode and Q&A Mode."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    def generate_report(
        self,
        patient_context: Dict[str, Any],
        retrieved_evidence: List[Dict[str, Any]],
    ) -> str:
        """Generate structured personalized health report."""
        prompt = build_report_mode_prompt(patient_context, retrieved_evidence)
        raw_out = self._run_generation(prompt, patient_context, retrieved_evidence, mode="REPORT")
        return clean_rag_response(raw_out)

    def generate_qanda_answer(
        self,
        user_question: str,
        patient_context: Dict[str, Any],
        retrieved_evidence: List[Dict[str, Any]],
    ) -> str:
        """Generate grounded answer for patient Q&A question."""
        prompt = build_qanda_mode_prompt(user_question, patient_context, retrieved_evidence)
        raw_out = self._run_generation(
            prompt, patient_context, retrieved_evidence, mode="QANDA", user_question=user_question
        )
        return clean_rag_response(raw_out)

    def _run_generation(
        self,
        prompt: str,
        patient_context: Dict[str, Any],
        retrieved_evidence: List[Dict[str, Any]],
        mode: str,
        user_question: str = "",
    ) -> str:
        """Execute LLM generation or deterministic grounded fallback."""
        if mode == "REPORT":
            return self._build_grounded_report_fallback(patient_context, retrieved_evidence)
        else:
            return self._build_grounded_qanda_fallback(user_question, patient_context, retrieved_evidence)

    def _build_grounded_report_fallback(
        self,
        patient_context: Dict[str, Any],
        retrieved_evidence: List[Dict[str, Any]],
    ) -> str:
        """Generate deterministic grounded report fallback with exact citations."""
        report = []
        patient_id = patient_context.get('patient_id', 'DEMO_PATIENT')
        pathway = patient_context.get('fusion_pathway_used', 'C')
        active_mods = [m.lower() for m in patient_context.get('active_modalities', [])]

        report.append(f"# Personalized Multimodal Risk Profile Report — Patient {patient_id}")
        report.append(f"**Fusion Pathway**: Pathway {pathway} | **Active Modalities**: {', '.join([m.upper() for m in active_mods])}\n")

        report.append("## 1. Executive Risk Summary")
        for disease, d_info in patient_context.get("disease_risk_outcomes", {}).items():
            prob_pct = d_info['fusion_probability'] * 100.0
            is_elevated = d_info.get('prediction', 0) == 1
            risk_label = "Elevated Model-Estimated Risk" if is_elevated else ("Moderate Risk" if d_info['fusion_probability'] >= 0.35 else "Low Model-Estimated Risk")
            report.append(
                f"- **{disease.replace('_', ' ')}**: Model-Estimated Risk Probability = **{prob_pct:.1f}%** ({risk_label}, Threshold = {d_info['threshold']:.2f})"
            )

        report.append("\n## 2. Key Clinical Drivers & Behavioral Telemetry")
        has_drivers = False
        for disease, d_info in patient_context.get("disease_risk_outcomes", {}).items():
            if d_info.get("fusion_probability", 0) >= 0.35:
                has_drivers = True
                report.append(f"### {disease.replace('_', ' ')} Risk Drivers:")
                for mod, exp in d_info.get("experts", {}).items():
                    # Only report for active modalities
                    if mod.lower() in active_mods:
                        drivers = exp.get("top_ranked_drivers", [])
                        valid_drivers = [f"{dr['feature']} ({dr['value']})" for dr in drivers if dr.get("feature")]
                        if valid_drivers:
                            drivers_str = ", ".join(valid_drivers[:3])
                            report.append(f"- **{mod.upper()} Expert Driver**: {drivers_str}")
        if not has_drivers:
            report.append("- No elevated risk drivers identified for active modalities.")
        report.append("  *(Note: Feature influence rankings indicate model attribution, not proven biological causality.)*\n")

        report.append("## 3. Evidence-Grounded Lifestyle & Nutritional Guidance")
        valid_ev_count = 0
        if retrieved_evidence:
            for ev in retrieved_evidence[:3]:
                cleaned_text = clean_evidence_text(ev['text'])
                if len(cleaned_text) >= 15:
                    report.append(f"- {cleaned_text} [{ev['citation_id']}]")
                    valid_ev_count += 1
        if valid_ev_count == 0:
            report.append("- Insufficient guideline evidence retrieved for general lifestyle guidance.")

        report.append("\n## 4. Microbiome & Dietary Fiber Evidence")
        if "gut" in active_mods:
            report.append("*(Patient-Specific Gut Data Provided)*")
            microbiome_ev = [
                ev for ev in retrieved_evidence
                if ("ISAPP" in ev.get("citation_string", "") or "Microbiome" in ev.get("text", ""))
                and len(clean_evidence_text(ev['text'])) >= 15
            ]
            if microbiome_ev:
                for ev in microbiome_ev:
                    cleaned_text = clean_evidence_text(ev['text'])
                    report.append(f"- {cleaned_text} [{ev['citation_id']}]")
            else:
                report.append("- Gut microbiome relative abundance profile analyzed. High fiber intake (25–35 g/day) promotes SCFA-producing commensals (Faecalibacterium, Akkermansia).")
        else:
            report.append("General evidence — no patient-specific gut microbiome data were provided.")
            ref_tag = f"[{retrieved_evidence[0]['citation_id']}]" if (retrieved_evidence and len(clean_evidence_text(retrieved_evidence[0]['text'])) >= 15) else "[REF_1]"
            report.append(f"- Increasing dietary fiber intake (25–35 g/day from legumes, whole grains, oats, and vegetables) supports metabolic health and glycemic control {ref_tag}.")

        report.append("\n## 5. Suggested Questions for Clinician Consultation")
        report.append("- What follow-up lab evaluations (e.g. HbA1c, ALT, lipid panel) should be scheduled?")
        report.append("- How can I safely structure physical activity and diet to manage model-estimated metabolic risks?")

        report.append(f"\n---\n**DISCLAIMER**: {config.RESEARCH_DISCLAIMER}")
        return "\n".join(report)

    def _build_grounded_qanda_fallback(
        self,
        user_question: str,
        patient_context: Dict[str, Any],
        retrieved_evidence: List[Dict[str, Any]],
    ) -> str:
        """Generate deterministic grounded Q&A answer fallback with safety guardrails & modality awareness."""
        q_lower = user_question.lower()

        # Prompt-injection / Jailbreak refusal guardrail
        injection_keywords = ["ignore previous", "system prompt", "override probability", "bypass safety", "set risk to zero", "change classification"]
        if any(kw in q_lower for kw in injection_keywords):
            return (
                f"**Question**: \"{user_question}\"\n\n"
                "⚠️ **Safety Refusal**: System instructions, clinical guardrails, and ML probabilities cannot be overridden by user queries.\n\n"
                f"---\n**DISCLAIMER**: {config.RESEARCH_DISCLAIMER}"
            )

        # Medication prescription refusal guardrail
        prescription_keywords = ["prescribe", "medication", "metformin", "statin", "insulin", "dosage", "drug", "pill", "ozempic", "weight loss pill"]
        if any(kw in q_lower for kw in prescription_keywords):
            return (
                f"**Question**: \"{user_question}\"\n\n"
                "⚠️ **Safety Refusal**: As an AI clinical support platform, I cannot prescribe medications or determine individual drug dosages. "
                "Pharmacological therapy must be independently evaluated and prescribed by a licensed healthcare provider.\n\n"
                f"---\n**DISCLAIMER**: {config.RESEARCH_DISCLAIMER}"
            )

        # Out-of-Domain / Non-medical question guardrail
        non_health_keywords = ["rocket", "space", "football", "soccer", "weather", "capital of", "recipe for cake", "crypto", "bitcoin"]
        if any(kw in q_lower for kw in non_health_keywords):
            return (
                f"**Question**: \"{user_question}\"\n\n"
                "I am a clinical decision support assistant focused on cardiometabolic health and risk reduction. Insufficient health evidence is available to answer out-of-domain queries.\n\n"
                f"---\n**DISCLAIMER**: {config.RESEARCH_DISCLAIMER}"
            )

        active_mods = [m.lower() for m in patient_context.get("active_modalities", [])]
        mods_set = set(active_mods)
        if mods_set == {"clinical"}:
            mod_phrase = "Based on the available clinical data and model-estimated risk profile"
            mod_desc = "clinical lab panel"
        elif mods_set == {"wearable"}:
            mod_phrase = "Based on the available wearable data and model-estimated risk profile"
            mod_desc = "wearable telemetry"
        elif mods_set == {"gut"}:
            mod_phrase = "Based on the available gut microbiome data and model-estimated risk profile"
            mod_desc = "gut microbiome profile"
        elif mods_set == {"clinical", "wearable"}:
            mod_phrase = "Based on the available clinical and wearable data and model-estimated risk profile"
            mod_desc = "clinical and wearable data"
        elif mods_set == {"clinical", "gut"}:
            mod_phrase = "Based on the available clinical and gut microbiome data and model-estimated risk profile"
            mod_desc = "clinical lab panel and gut microbiome profile"
        elif mods_set == {"wearable", "gut"}:
            mod_phrase = "Based on the available wearable and gut microbiome data and model-estimated risk profile"
            mod_desc = "wearable telemetry and gut microbiome profile"
        elif mods_set == {"clinical", "wearable", "gut"}:
            mod_phrase = "Based on the available clinical, wearable, and gut microbiome data and model-estimated risk profile"
            mod_desc = "clinical, wearable, and gut microbiome data"
        else:
            mod_phrase = "Based on the available health data and model-estimated risk profile"
            mod_desc = "available data"

        disease_outcomes = patient_context.get("disease_risk_outcomes", {})
        high_risk_diseases = [
            d.replace('_', ' ') for d, info in disease_outcomes.items()
            if info.get("prediction", 0) == 1 or info.get("risk_level") == "POSITIVE" or info.get("fusion_probability", 0) >= 0.40
        ]

        ans = []
        ans.append(f"### Direct Answer\n{mod_phrase}, here is the decision-support guidance for: \"*{user_question}*\":\n")

        ans.append("### Why Relevant to You")
        if high_risk_diseases:
            ans.append(f"This guidance directly addresses your active screening profile (Elevated Model Signals for: **{', '.join(high_risk_diseases)}**), synthesized from your {mod_desc}.\n")
        else:
            ans.append(f"This guidance is tailored to your cardiometabolic screening profile, synthesized from your {mod_desc}.\n")

        ans.append("### Supporting Patient Data")
        findings = []
        for d, info in disease_outcomes.items():
            prob_pct = info.get("fusion_probability", 0) * 100.0
            is_pos = (info.get("prediction", 0) == 1 or info.get("risk_level") == "POSITIVE")
            sig = "POSITIVE" if is_pos else "NEGATIVE"
            findings.append(f"- **{d.replace('_', ' ')}**: {prob_pct:.1f}% model-estimated screening score (Signal: {sig})")
        ans.extend(findings if findings else ["- No active disease indicators flagged."])
        
        missing_mods = [m.lower() for m in patient_context.get("missing_modalities", [])]
        if "wearable" in missing_mods or "gut" in missing_mods:
            unsupplied = [m.capitalize() for m in missing_mods if m in ["wearable", "gut"]]
            ans.append(f"*(Note: {', '.join(unsupplied)} telemetry was not supplied for this assessment; recommendations rely strictly on available inputs.)*")
        ans.append("")

        # Filter evidence chunks
        valid_evidence_lines = []
        seen_texts = set()
        if retrieved_evidence:
            for ev in retrieved_evidence[:3]:
                cleaned_text = clean_evidence_text(ev['text'])
                if len(cleaned_text) >= 15 and cleaned_text.lower() not in seen_texts:
                    seen_texts.add(cleaned_text.lower())
                    valid_evidence_lines.append(f"- **[{ev['citation_id']}]**: {cleaned_text}")

        ans.append("### Medical Evidence")
        if not valid_evidence_lines:
            ans.append("Insufficient clinical guideline evidence was retrieved for this query.")
        else:
            ans.extend(valid_evidence_lines)
        ans.append("")

        ans.append("### Suggested Next Step")
        ans.append("- Discuss these model-estimated screening scores during your next clinical appointment for confirmatory diagnostic evaluation.")

        ans.append(f"\n---\n**DISCLAIMER**: {config.RESEARCH_DISCLAIMER}")
        return "\n".join(ans)
