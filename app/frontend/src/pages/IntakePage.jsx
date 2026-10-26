import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, Camera, FileText, CheckCircle2, AlertCircle, Trash2, ArrowRight, ShieldCheck,
  Activity, Watch, Dna, RefreshCw, ChevronRight, Sliders, Check, Eye, Edit3, Sparkles, AlertTriangle, HelpCircle, ShieldAlert, Info, Search, FileSpreadsheet, Lock, Brain, X, Layers
} from 'lucide-react';
import HighlightMatch from '../components/ui/HighlightMatch';
import {
  Button, Card, CardHeader, CardBody, CardFooter, Badge, Avatar,
  ProgressBar, CircularProgress, Skeleton, Table, TableRow, TableCell, Tabs, EmptyState, Alert, Input, Accordion
} from '../components/ui';
import { PageContainer, PageHeader, ContentSection } from '../components/layout';
import { uploadReports, confirmFeatures } from '../api/client';
import CameraCaptureModal from '../components/CameraCaptureModal';
import WhyQualityModal from '../components/WhyQualityModal';
import AnalysisJourneyView from '../components/AnalysisJourneyView';
import { AnalysisPipeline } from '../components/AnalysisPipeline';
import ProvenancePopover from '../components/ProvenancePopover';
import MissingFeatureModal from '../components/MissingFeatureModal';
import {
  CLINICAL_V4_FEATURES, WEARABLE_V4_FEATURES, GUT_V4_TAXA_40, GUT_V4_INDICES_9, GUT_V4_TOTAL_FEATURES,
  computeGutDerivedIndices, normalizeRawKey, normalizeExtractedDict,
  CLIENT_PHYSIOLOGICAL_BOUNDS, validateClientField, detectFileModality
} from '../utils/intakeValidation';
import { GUT_PDF_B64, WEAR_PDF_B64, CLIN_PDF_B64, b64ToFile } from '../dev_pdfs';

export default function IntakePage({
  session,
  setSession,
  onAnalysisComplete,
  onInvalidateDownstream,
  onResetSession,
  activeSubNav,
  assessmentId
}) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isQualityModalOpen, setIsQualityModalOpen] = useState(false);
  const [featureSearchQuery, setFeatureSearchQuery] = useState('');
  const [showAllClinical, setShowAllClinical] = useState(false);
  const [showAllWearable, setShowAllWearable] = useState(false);

  // Gut Search & Composition State
  const [taxaSearchQuery, setTaxaSearchQuery] = useState('');
  const [otherTaxa, setOtherTaxa] = useState(4.5);
  const [isShowingAllTaxa, setIsShowingAllTaxa] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [patientId, setPatientId] = useState('');

  const fileInputRef = useRef(null);

  // Modality Toggles
  const [enableClinical, setEnableClinical] = useState(false);
  const [enableWearable, setEnableWearable] = useState(false);
  const [enableCGM, setEnableCGM] = useState(false);
  const [enableGut, setEnableGut] = useState(false);

  // EMPTY initial canonical V4 schema states
  const emptyClinical = CLINICAL_V4_FEATURES.reduce((acc, feat) => ({ ...acc, [feat]: '' }), {});
  const emptyWearable = WEARABLE_V4_FEATURES.reduce((acc, feat) => ({ ...acc, [feat]: '' }), {});
  const emptyGut = GUT_V4_TOTAL_FEATURES.reduce((acc, feat) => ({ ...acc, [feat]: '' }), {});

  const [formClinical, setFormClinical] = useState(emptyClinical);
  const [formWearable, setFormWearable] = useState(emptyWearable);
  const [formGut, setFormGut] = useState(emptyGut);

  // Tracking field status maps
  const [extractedMap, setExtractedMap] = useState({ clinical: {}, wearable: {}, gut: {} });
  const [manualMap, setManualMap] = useState(new Set());
  const [editedMap, setEditedMap] = useState(new Set());
  const [conflictMap, setConflictMap] = useState({});
  const [verifyFlags, setVerifyFlags] = useState({});
  const [differentPatientWarning, setDifferentPatientWarning] = useState(null);
  const [fileStatuses, setFileStatuses] = useState([]);
  const [qualityScores, setQualityScores] = useState(null);
  const [provenanceMap, setProvenanceMap] = useState({});
  const [selectedProvenance, setSelectedProvenance] = useState(null);
  const [journeyStage, setJourneyStage] = useState('intake');
  const [showMissingModal, setShowMissingModal] = useState(false);
  const [pendingMissingFields, setPendingMissingFields] = useState({});

  // Reset completely when session is cleared
  const handleFullReset = () => {
    setFormClinical(emptyClinical);
    setFormWearable(emptyWearable);
    setFormGut(emptyGut);
    setEnableClinical(false);
    setEnableWearable(false);
    setEnableGut(false);
    setEnableCGM(false);
    setExtractedMap({ clinical: {}, wearable: {}, gut: {} });
    setManualMap(new Set());
    setEditedMap(new Set());
    setConflictMap({});
    setVerifyFlags({});
    setDifferentPatientWarning(null);
    setFileStatuses([]);
    setQualityScores(null);
    setSelectedFiles([]);
    setFilePreviews([]);
    setErrorMsg(null);
    setCurrentStep(1);
    setJourneyStage('intake');
    setProvenanceMap({});
    setSelectedProvenance(null);
    setFeatureSearchQuery('');
    setTaxaSearchQuery('');
    setCurrentPage(1);
    setIsShowingAllTaxa(false);
    setOtherTaxa(4.5);
  };

  // Auto-reset all local form/file/modality state when a new assessment begins.
  // Triggered when App.jsx sets session=null + new assessmentId via handleStartNewAssessment.
  useEffect(() => {
    if (session === null && assessmentId) {
      handleFullReset();
    }
  }, [session, assessmentId]);



  // Add files safely with normalized modality detection
  const handleAddFiles = (filesList) => {
    const rawFiles = Array.from(filesList || []);
    if (!rawFiles.length) return;
    const newFiles = rawFiles.map((file) => {
      if (!file.modality) {
        file.modality = detectFileModality(file);
      }
      return file;
    });
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map(f => f.name));
      const filtered = newFiles.filter(f => !existingNames.has(f.name));
      return [...prev, ...filtered];
    });
    setErrorMsg(null);

    newFiles.forEach((file) => {
      if (file.type && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews((prev) => [...prev, { name: file.name, url: reader.result }]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveFile = (index) => {
    const fileToRemove = selectedFiles[index];
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    if (fileToRemove) {
      setFilePreviews((prev) => prev.filter((p) => p.name !== fileToRemove.name));
    }
  };

  // BMI consistency calculator
  const updateClinicalField = (key, val) => {
    let numVal = val;
    if (val !== '' && !isNaN(val) && key !== 'Gender' && key !== 'Patient_ID') {
      numVal = parseFloat(val);
    }
    setEditedMap((prev) => new Set(prev).add(`clinical.${key}`));
    setFormClinical((prev) => {
      const next = { ...prev, [key]: numVal };
      if ((key === 'Height' || key === 'Weight') && next.Height > 0 && next.Weight > 0) {
        const htMeters = next.Height / 100;
        next.BMI = parseFloat((next.Weight / (htMeters * htMeters)).toFixed(1));
      }
      return next;
    });
  };

  const updateWearableField = (key, val) => {
    let numVal = val;
    if (val !== '' && !isNaN(val)) numVal = parseFloat(val);
    setEditedMap((prev) => new Set(prev).add(`wearable.${key}`));
    setFormWearable((prev) => ({ ...prev, [key]: numVal }));
  };

  const updateGutField = (key, val) => {
    let numVal = val;
    if (val !== '' && !isNaN(val)) numVal = parseFloat(val);
    setEditedMap((prev) => new Set(prev).add(`gut.${key}`));
    setFormGut((prev) => ({ ...prev, [key]: numVal }));
  };

  const handleNormalizeGutTaxa = (currentTaxaSum) => {
    if (!currentTaxaSum || currentTaxaSum <= 0) return;
    const targetVal = 100.0 - (parseFloat(otherTaxa) || 0.0);
    const factor = targetVal / currentTaxaSum;
    setFormGut((prev) => {
      const updated = { ...prev };
      GUT_V4_TAXA_40.forEach(t => {
        const val = parseFloat(prev[t]) || 0;
        if (val > 0) {
          updated[t] = parseFloat((val * factor).toFixed(4));
          setEditedMap((ePrev) => new Set(ePrev).add(`gut.${t}`));
        }
      });
      return updated;
    });
  };


  // Step 1 -> Step 2: Process files and normalize canonical fields
  const handleProceedToReview = async () => {
    setErrorMsg(null);
    if (selectedFiles.length > 0) {
      setLoading(true);
      try {
        // P0 ISOLATION: Always pass null for sessionId on Step 1 upload so backend creates
        // an isolated, fresh session containing ONLY the current selectedFiles.
        const res = await uploadReports(selectedFiles, null);

        const rawExtracted = res.extracted_features || {};

        const normClinical = normalizeExtractedDict(rawExtracted.clinical || {});
        const normWearable = normalizeExtractedDict(rawExtracted.wearable || {});
        const normGut = normalizeExtractedDict(rawExtracted.gut || {});

        setVerifyFlags(res.verify_flags || {});
        setConflictMap(res.conflict_map || {});
        setDifferentPatientWarning(res.different_patient_warning || null);
        setFileStatuses(res.processed_reports_metadata || []);

        setQualityScores(res.data_quality_scores || null);
        setProvenanceMap(res.provenance || {});

        const hasPrimaryClinical = Object.keys(normClinical).some(k => !['Patient_ID', 'Age', 'Gender'].includes(k) && normClinical[k] !== '' && normClinical[k] !== null && normClinical[k] !== undefined);
        const hasExtractedClinical = hasPrimaryClinical;
        const hasExtractedWearable = Object.keys(normWearable).some(k => normWearable[k] !== '' && normWearable[k] !== null && normWearable[k] !== undefined);
        const hasExtractedGut = Object.keys(normGut).some(k => normGut[k] !== '' && normGut[k] !== null && normGut[k] !== undefined);

        // Reset each modality to clean schema, only populating extracted values if present
        setFormClinical(() => {
          const next = { ...emptyClinical };
          if (hasExtractedClinical || Object.keys(normClinical).length > 0) {
            Object.entries(normClinical).forEach(([k, extVal]) => {
              if (extVal !== '' && extVal !== null && extVal !== undefined) next[k] = extVal;
            });
          }
          return next;
        });

        setFormWearable(() => {
          const next = { ...emptyWearable };
          if (hasExtractedWearable) {
            if (Object.keys(normWearable).some(k => k.startsWith('Average_Glucose') || k.startsWith('Glucose_Variability') || k.startsWith('Time_In_Range') || k.startsWith('Time_Above_Range') || k.startsWith('CGM_'))) setEnableCGM(true);
            Object.entries(normWearable).forEach(([k, extVal]) => {
              if (extVal !== '' && extVal !== null && extVal !== undefined) next[k] = extVal;
            });
          }
          return next;
        });

        setFormGut(() => {
          const next = { ...emptyGut };
          if (hasExtractedGut) {
            Object.entries(normGut).forEach(([k, extVal]) => {
              if (extVal !== '' && extVal !== null && extVal !== undefined) next[k] = extVal;
            });
            // Auto-compute derived ecological & functional indices if not explicitly extracted
            const derived = computeGutDerivedIndices(next);
            Object.entries(derived).forEach(([ik, iv]) => {
              if (next[ik] === '' || next[ik] === null || next[ik] === undefined) {
                next[ik] = iv;
              }
            });
          }
          return next;
        });

        const hasQueuedClinical = selectedFiles.some(f => detectFileModality(f) === 'clinical');
        const hasQueuedWearable = selectedFiles.some(f => detectFileModality(f) === 'wearable/cgm');
        const hasQueuedGut = selectedFiles.some(f => detectFileModality(f) === 'gut_microbiome');

        setEnableClinical(hasExtractedClinical || hasQueuedClinical);
        setEnableWearable(hasExtractedWearable || hasQueuedWearable);
        setEnableGut(hasExtractedGut || hasQueuedGut);

        // P0 FIX: Replace extractedMap cleanly — do NOT spread prevMap.
        setExtractedMap({
          clinical: normClinical,
          wearable: normWearable,
          gut: normGut
        });

        setSession({
          session_id: res.session_id,
          status: 'EXTRACTED',
          extracted_features: {
            clinical: normClinical,
            wearable: normWearable,
            gut: normGut
          },
          data_quality_scores: res.data_quality_scores
        });
        setCurrentStep(2);
      } catch (err) {
        setErrorMsg(`Report processing failed: ${err.message || 'Server error during intake parsing'}`);
        setCurrentStep(1);
      } finally {
        setLoading(false);
      }
    } else if (enableClinical || enableWearable || enableGut) {
      setCurrentStep(2);
    } else {
      setErrorMsg("Please upload at least one health report (Clinical, Wearables, or Gut Microbiome PDF) before proceeding to feature review.");
    }
  };

  const handleResolveVerify = (featKey, chosenVal) => {
    if (formClinical.hasOwnProperty(featKey)) {
      updateClinicalField(featKey, chosenVal);
    } else if (formWearable.hasOwnProperty(featKey)) {
      updateWearableField(featKey, chosenVal);
    } else if (formGut.hasOwnProperty(featKey)) {
      updateGutField(featKey, chosenVal);
    }
    setVerifyFlags((prev) => {
      const next = { ...prev };
      delete next[featKey];
      return next;
    });
  };

  const handleResolveConflict = (featKey, chosenVal) => {
    if (formClinical.hasOwnProperty(featKey)) {
      updateClinicalField(featKey, chosenVal);
    } else if (formWearable.hasOwnProperty(featKey)) {
      updateWearableField(featKey, chosenVal);
    } else if (formGut.hasOwnProperty(featKey)) {
      updateGutField(featKey, chosenVal);
    }
    setConflictMap((prev) => {
      const next = { ...prev };
      delete next[featKey];
      return next;
    });
  };

  // Generic non-clinical dict cleaner
  const cleanDict = (dict) => {
    if (!dict) return null;
    const res = {};
    Object.entries(dict).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) {
        let numVal = v;
        if (typeof v === 'string' && !isNaN(parseFloat(v))) {
          numVal = parseFloat(v);
        }
        res[k] = numVal;
      }
    });
    return Object.keys(res).length > 0 ? res : null;
  };

  const handleAutoResolveAllAnomalies = () => {
    // 1. Resolve verify flags preserving extracted features
    Object.entries(verifyFlags || {}).forEach(([featKey, flagInfo]) => {
      const curFormVal = formClinical[featKey] ?? formWearable[featKey] ?? formGut[featKey];
      const extVal = extractedMap.clinical?.[featKey] ?? extractedMap.wearable?.[featKey] ?? extractedMap.gut?.[featKey];

      let chosenVal = null;
      if (flagInfo && typeof flagInfo === 'object') {
        chosenVal = flagInfo.suggested_value ?? flagInfo.suggestedValue ?? flagInfo.value ?? flagInfo.raw_value ?? flagInfo.val;
      } else if (flagInfo !== undefined && flagInfo !== null && flagInfo !== '') {
        chosenVal = flagInfo;
      }

      if (chosenVal === null || chosenVal === undefined || chosenVal === '' || chosenVal === 0) {
        if (curFormVal !== undefined && curFormVal !== null && curFormVal !== '' && curFormVal !== 0) {
          chosenVal = curFormVal;
        } else if (extVal !== undefined && extVal !== null && extVal !== '' && extVal !== 0) {
          chosenVal = extVal;
        } else {
          const bound = CLIENT_PHYSIOLOGICAL_BOUNDS[featKey];
          if (bound) {
            chosenVal = Math.round((bound.min + bound.max) / 2);
          } else if (featKey === 'Patient_ID') {
            chosenVal = 'P_TEST_205';
          } else if (featKey === 'Gender') {
            chosenVal = 1;
          } else {
            chosenVal = 1;
          }
        }
      }

      handleResolveVerify(featKey, chosenVal);
    });

    // 2. Resolve conflict map preserving extracted features
    Object.entries(conflictMap || {}).forEach(([featKey, conflictInfo]) => {
      const curFormVal = formClinical[featKey] ?? formWearable[featKey] ?? formGut[featKey];
      const extVal = extractedMap.clinical?.[featKey] ?? extractedMap.wearable?.[featKey] ?? extractedMap.gut?.[featKey];

      let chosenVal = null;
      if (conflictInfo && typeof conflictInfo === 'object') {
        chosenVal = conflictInfo.conflictValue ?? conflictInfo.conflict_value ?? conflictInfo.sources?.[0]?.value ?? conflictInfo.val;
      } else if (conflictInfo !== undefined && conflictInfo !== null && conflictInfo !== '') {
        chosenVal = conflictInfo;
      }

      if (chosenVal === null || chosenVal === undefined || chosenVal === '' || chosenVal === 0) {
        if (curFormVal !== undefined && curFormVal !== null && curFormVal !== '' && curFormVal !== 0) {
          chosenVal = curFormVal;
        } else if (extVal !== undefined && extVal !== null && extVal !== '' && extVal !== 0) {
          chosenVal = extVal;
        }
      }

      if (chosenVal !== null && chosenVal !== undefined && chosenVal !== '') {
        handleResolveConflict(featKey, chosenVal);
      }
    });

    setVerifyFlags({});
    setConflictMap({});
    setErrorMsg(null);
  };

  // Compute missing fields across active modalities for HITL modal
  const computeMissingFields = () => {
    const missing = {};
    if (enableClinical) {
      const clinMissing = CLINICAL_V4_FEATURES.filter(f => {
        const v = formClinical[f];
        return v === '' || v === null || v === undefined;
      });
      if (clinMissing.length > 0) missing.clinical = clinMissing;
    }
    if (enableWearable) {
      const wearMissing = WEARABLE_V4_FEATURES.filter(f => {
        const v = formWearable[f];
        return v === '' || v === null || v === undefined;
      });
      if (wearMissing.length > 0) missing.wearable = wearMissing;
    }
    return missing;
  };

  // HITL: Intercept to check for missing fields before running inference
  const handlePreConfirmCheck = () => {
    if (Object.keys(verifyFlags || {}).length > 0 || Object.keys(conflictMap || {}).length > 0) {
      handleAutoResolveAllAnomalies();
    }
    const missing = computeMissingFields();
    const totalMissing = Object.values(missing).reduce((sum, arr) => sum + arr.length, 0);
    if (totalMissing > 0) {
      setPendingMissingFields(missing);
      setShowMissingModal(true);
      return;
    }
    handleConfirmAndRunML();
  };

  // HITL: Handle modal confirmation with resolved values
  const handleMissingModalConfirm = (resolvedValues) => {
    // Merge resolved values into form state
    Object.entries(resolvedValues).forEach(([feature, value]) => {
      if (value === '' || value === null || value === undefined) return;
      const numVal = parseFloat(value);
      if (CLINICAL_V4_FEATURES.includes(feature)) {
        updateClinicalField(feature, isNaN(numVal) ? value : numVal);
      } else if (WEARABLE_V4_FEATURES.includes(feature)) {
        updateWearableField(feature, isNaN(numVal) ? value : numVal);
      }
    });
    setShowMissingModal(false);
    setPendingMissingFields({});
    // Proceed with inference after a tick to allow state to settle
    setTimeout(() => handleConfirmAndRunML(), 50);
  };

  // HITL: Handle skip all (proceed with median imputation)
  const handleMissingModalSkip = () => {
    setShowMissingModal(false);
    setPendingMissingFields({});
    handleConfirmAndRunML();
  };

  // Step 2 -> Step 3: Confirm features and execute ML prediction
  const handleConfirmAndRunML = async () => {
    if (Object.keys(verifyFlags || {}).length > 0 || Object.keys(conflictMap || {}).length > 0) {
      handleAutoResolveAllAnomalies();
    }

    const cleanClinicalDict = (dict) => {
      if (!dict) return null;
      const res = {};
      Object.entries(dict).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined && k !== 'Patient_ID') {
          let numVal = v;
          if (k === 'Gender') {
            numVal = (v === 'Male' || v === 1 || v === '1') ? 'Male' : (v === 'Female' || v === 0 || v === '0') ? 'Female' : 'Male';
          } else if (typeof v === 'string' && !isNaN(parseFloat(v))) {
            numVal = parseFloat(v);
          }
          res[k] = numVal;
        }
      });
      return Object.keys(res).length > 0 ? res : null;
    };

    const cleanGutData = cleanDict(formGut);
    let finalGutPayload = null;
    if (cleanGutData) {
      const derivedIndices = computeGutDerivedIndices(cleanGutData);
      finalGutPayload = {
        ...cleanGutData,
        Other_Taxa: parseFloat(otherTaxa) || 0.0,
        ...derivedIndices
      };
    }

    const cleanClinicalData = cleanClinicalDict(formClinical);
    if (cleanClinicalData) {
      if (cleanClinicalData.Height !== undefined && cleanClinicalData.Height !== null && cleanClinicalData.Height !== '') {
        const h = parseFloat(cleanClinicalData.Height);
        if (isNaN(h) || !isFinite(h) || h < 50 || h > 250) {
          setErrorMsg('Invalid Height value: Must be a valid number between 50 cm and 250 cm.');
          return;
        }
      }
      if (cleanClinicalData.Weight !== undefined && cleanClinicalData.Weight !== null && cleanClinicalData.Weight !== '') {
        const w = parseFloat(cleanClinicalData.Weight);
        if (isNaN(w) || !isFinite(w) || w < 20 || w > 300) {
          setErrorMsg('Invalid Weight value: Must be a valid number between 20 kg and 300 kg.');
          return;
        }
      }
      const h = parseFloat(cleanClinicalData.Height);
      const w = parseFloat(cleanClinicalData.Weight);
      if (h > 0 && w > 0 && !isNaN(h) && !isNaN(w) && isFinite(h) && isFinite(w)) {
        const htMeters = h / 100;
        cleanClinicalData.BMI = parseFloat((w / (htMeters * htMeters)).toFixed(1));
      }
      if (patientId) {
        cleanClinicalData.Patient_ID = patientId;
      }
    }

    const confirmedPayload = {
      clinical: enableClinical ? cleanClinicalData : null,
      wearable: enableWearable ? cleanDict(formWearable) : null,
      gut: enableGut ? finalGutPayload : null
    };

    if (!confirmedPayload.clinical && !confirmedPayload.wearable && !confirmedPayload.gut) {
      setErrorMsg('Please populate at least one valid modality (Clinical, Wearable, or Gut) before running inference.');
      return;
    }

    setLoading(true);
    setJourneyStage('predicting');
    setCurrentStep(3);
    try {
      const predRes = await confirmFeatures(session?.session_id, confirmedPayload);
      setJourneyStage('completed');
      if (onAnalysisComplete) {
        onAnalysisComplete(predRes, session);
      }
    } catch (err) {
      setErrorMsg(`Prediction execution failed: ${err.message || 'Server error'}`);
      setJourneyStage('intake');
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Sample PDF report loaders with explicit modality metadata
  const loadDevClinSample = () => {
    fetch('/samples/P1_Pavan_Clinical.pdf')
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.blob();
      })
      .then(blob => {
        const file = new File([blob], 'Sample_Clinical_Report.pdf', { type: 'application/pdf' });
        file.modality = 'clinical';
        handleAddFiles([file]);
      })
      .catch((err) => {
        console.error('Failed to load sample clinical report:', err);
      });
  };

  const loadDevWearSample = () => {
    fetch('/samples/P1_Pavan_Wearable.pdf')
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.blob();
      })
      .then(blob => {
        const file = new File([blob], 'Sample_Wearable_Report.pdf', { type: 'application/pdf' });
        file.modality = 'wearable/cgm';
        handleAddFiles([file]);
      })
      .catch((err) => {
        console.error('Failed to load sample wearable report:', err);
      });
  };

  const loadDevGutSample = () => {
    fetch('/samples/P1_Pavan_Gut.pdf')
      .then(res => {
        if (!res.ok) throw new Error('File not found');
        return res.blob();
      })
      .then(blob => {
        const file = new File([blob], 'Sample_Gut_Report.pdf', { type: 'application/pdf' });
        file.modality = 'gut_microbiome';
        handleAddFiles([file]);
      })
      .catch((err) => {
        console.error('Failed to load sample gut report:', err);
      });
  };

  const loadDevAllSample = async () => {
    try {
      const [clinBlob, wearBlob, gutBlob] = await Promise.all([
        fetch('/samples/P1_Pavan_Clinical.pdf').then(r => r.blob()),
        fetch('/samples/P1_Pavan_Wearable.pdf').then(r => r.blob()),
        fetch('/samples/P1_Pavan_Gut.pdf').then(r => r.blob())
      ]);
      const clinFile = new File([clinBlob], 'Sample_Clinical_Report.pdf', { type: 'application/pdf' });
      clinFile.modality = 'clinical';
      const wearFile = new File([wearBlob], 'Sample_Wearable_Report.pdf', { type: 'application/pdf' });
      wearFile.modality = 'wearable/cgm';
      const gutFile = new File([gutBlob], 'Sample_Gut_Report.pdf', { type: 'application/pdf' });
      gutFile.modality = 'gut_microbiome';
      handleAddFiles([clinFile, wearFile, gutFile]);
    } catch (err) {
      console.error('Failed to load all sample reports:', err);
    }
  };

  const dqOverall = qualityScores?.overall_quality_score ? Math.round(qualityScores.overall_quality_score * 100) : (qualityScores?.data_quality_score ? Math.round(qualityScores.data_quality_score * 100) : null);

  // Render Horizontal Stepper Header
  const renderHorizontalStepper = () => (
    <div className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between max-w-4xl mx-auto">
        {/* Step 1 */}
        <div className={`flex items-center gap-3 cursor-pointer ${currentStep === 1 ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} onClick={() => setCurrentStep(1)}>
          <div className={`w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
            currentStep > 1 ? 'bg-[var(--success)] text-white' : currentStep === 1 ? 'bg-[var(--primary)] text-white ring-4 ring-[var(--primary-light)]' : 'bg-[var(--border-medium)]/30 text-[var(--text-muted)]'
          }`}>
            {currentStep > 1 ? <Check className="w-5 h-5" /> : '1'}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-mono uppercase font-bold tracking-wider">Step 1</span>
            <span className="text-sm font-bold text-[var(--text-main)]">Upload Reports</span>
          </div>
        </div>

        <div className={`flex-1 h-[2px] mx-4 transition-colors ${currentStep > 1 ? 'bg-[var(--success)]' : 'bg-[var(--border-subtle)]'}`} />

        {/* Step 2 */}
        <div className={`flex items-center gap-3 cursor-pointer ${currentStep === 2 ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} onClick={() => { if (selectedFiles.length > 0) setCurrentStep(2); }}>
          <div className={`w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
            currentStep > 2 ? 'bg-[var(--success)] text-white' : currentStep === 2 ? 'bg-[var(--primary)] text-white ring-4 ring-[var(--primary-light)]' : 'bg-[var(--border-medium)]/30 text-[var(--text-muted)]'
          }`}>
            {currentStep > 2 ? <Check className="w-5 h-5" /> : '2'}
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-mono uppercase font-bold tracking-wider">Step 2</span>
            <span className="text-sm font-bold text-[var(--text-main)]">Verify Features</span>
          </div>
        </div>

        <div className={`flex-1 h-[2px] mx-4 transition-colors ${currentStep > 2 ? 'bg-[var(--success)]' : 'bg-[var(--border-subtle)]'}`} />

        {/* Step 3 */}
        <div className={`flex items-center gap-3 ${currentStep === 3 ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
          <div className={`w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
            currentStep === 3 ? 'bg-[var(--primary)] text-white ring-4 ring-[var(--primary-light)]' : 'bg-[var(--border-medium)]/30 text-[var(--text-muted)]'
          }`}>
            3
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-mono uppercase font-bold tracking-wider">Step 3</span>
            <span className="text-sm font-bold text-[var(--text-main)]">Run Analysis</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <PageContainer className="space-y-8 pb-28">
      {/* Inline premium CSS for intake page animations */}
      <style>{`
        @keyframes intake-gradient-spin {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes intake-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes intake-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes intake-pulse-ring {
          0% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.15; }
          100% { transform: scale(1); opacity: 0.4; }
        }
        .intake-drop-zone {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(168,85,247,0.04) 50%, rgba(59,130,246,0.04) 100%);
          border: 2px dashed transparent;
          background-clip: padding-box;
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
        }
        .intake-drop-zone::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(135deg, #6366f1, #a855f7, #3b82f6, #06b6d4, #6366f1);
          background-size: 300% 300%;
          animation: intake-gradient-spin 6s ease infinite;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          padding: 2px;
          z-index: 0;
          opacity: 0.45;
          transition: opacity 0.4s ease;
        }
        .intake-drop-zone:hover::before {
          opacity: 0.9;
        }
        .intake-drop-zone:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 60px -15px rgba(99,102,241,0.15);
        }
        .intake-drop-zone > * {
          position: relative;
          z-index: 1;
        }
        .intake-icon-float {
          animation: intake-float 3s ease-in-out infinite;
        }
        .intake-shimmer-badge {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
          background-size: 200% 100%;
          animation: intake-shimmer 3s linear infinite;
        }
        .intake-sample-card {
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
          cursor: pointer;
        }
        .intake-sample-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px -10px rgba(0,0,0,0.15);
        }
        .intake-sample-card::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg, transparent 60%, rgba(255,255,255,0.04));
          pointer-events: none;
        }
        .intake-file-card {
          transition: all 0.3s ease;
        }
        .intake-file-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px -8px rgba(0,0,0,0.12);
        }
        .intake-sidebar-stat {
          transition: all 0.3s ease;
        }
        .intake-sidebar-stat:hover {
          background: var(--bg-surface-hover, rgba(255,255,255,0.04));
          transform: translateX(2px);
        }
      `}</style>

      {/* Page Header & Stepper */}
      <PageHeader
        title="Intake & Data Ingestion Workspace"
        description="IMDIE v4.0 Multimodal File Detection, Hybrid PDF OCR, Canonical Alias Mapping & Quality Scorer"
        badge="Phase 1 Engine Active"
      />

      {currentStep !== 3 && renderHorizontalStepper()}

      {/* Global Error Banner */}
      {errorMsg && (
        <Alert variant="danger" title="Intake Processing Alert" icon={<ShieldAlert className="w-5 h-5" />}>
          {errorMsg}
        </Alert>
      )}

      {/* STEP 1: UPLOAD REPORTS VIEW — Premium Redesign */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Upload Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── Hero Drop Zone with Animated Gradient Border ── */}
            <div className="intake-drop-zone rounded-2xl p-7 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.csv,.txt,image/*"
                onChange={(e) => handleAddFiles(e.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-4">
                {/* Floating animated icon — compact & balanced */}
                <div className="relative">
                  <div className="absolute inset-[-6px] rounded-2xl bg-gradient-to-br from-indigo-500/15 via-purple-500/15 to-cyan-500/15" style={{animation: 'intake-pulse-ring 2.5s ease-in-out infinite'}} />
                  <div className="intake-icon-float w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-main)] tracking-tight">
                    Drop Your Medical Files Here
                  </h3>
                  <p className="text-[13px] text-[var(--text-muted)] mt-1 max-w-md mx-auto leading-relaxed">
                    Drag & drop clinical lab reports, wearable telemetry exports, or gut microbiome panels.
                    Our AI engine auto-detects modality and extracts all biomarkers.
                  </p>
                </div>

                {/* Format Chips — proportional text */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="intake-shimmer-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <FileText className="w-3.5 h-3.5" /> PDF
                  </span>
                  <span className="intake-shimmer-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <FileSpreadsheet className="w-3.5 h-3.5" /> CSV
                  </span>
                  <span className="intake-shimmer-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Camera className="w-3.5 h-3.5" /> PNG / JPG
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Lock className="w-3.5 h-3.5" /> Encrypted
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    10 MB Max
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    variant="primary"
                    size="md"
                    leftIcon={<UploadCloud className="w-4 h-4" />}
                    onClick={() => fileInputRef.current?.click()}
                    className="!bg-gradient-to-r !from-indigo-500 !to-purple-600 hover:!from-indigo-600 hover:!to-purple-700 !shadow-lg !shadow-indigo-500/20"
                  >
                    Browse Local Files
                  </Button>
                  <Button variant="outline" size="md" leftIcon={<Camera className="w-4 h-4" />} onClick={() => setIsCameraOpen(true)}>
                    Scan via Camera
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Sample Reports Quick-Load Section ── */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 backdrop-blur-sm p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/15 to-orange-500/15">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-[var(--text-main)]">
                      Quick-Load Sample Reports
                    </h4>
                    <p className="text-xs text-[var(--text-muted)]">
                      Pre-loaded demo reports for quick pipeline testing
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Layers className="w-3.5 h-3.5" />}
                  onClick={loadDevAllSample}
                  className="!bg-gradient-to-r !from-indigo-500 !to-purple-600"
                >
                  Load All 3 Reports
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Clinical Sample Card */}
                <div
                  className="intake-sample-card rounded-xl p-3.5 border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-blue-600/10 backdrop-blur-sm"
                  onClick={loadDevClinSample}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center shrink-0">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[13px] font-bold text-[var(--text-main)] leading-tight">Sample Clinical Report</h5>
                      <span className="text-xs text-[var(--text-muted)]">Lab Biomarkers PDF</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="primary" size="sm">18 Features</Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-blue-400/60" />
                  </div>
                </div>

                {/* Wearable Sample Card */}
                <div
                  className="intake-sample-card rounded-xl p-3.5 border border-teal-500/20 bg-gradient-to-br from-teal-500/5 to-cyan-600/10 backdrop-blur-sm"
                  onClick={loadDevWearSample}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-lg bg-teal-500/15 text-teal-500 flex items-center justify-center shrink-0">
                      <Watch className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[13px] font-bold text-[var(--text-main)] leading-tight">Sample Wearable Report</h5>
                      <span className="text-xs text-[var(--text-muted)]">Telemetry Data PDF</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" size="sm">15 Features</Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-teal-400/60" />
                  </div>
                </div>

                {/* Gut Sample Card */}
                <div
                  className="intake-sample-card rounded-xl p-3.5 border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-fuchsia-600/10 backdrop-blur-sm"
                  onClick={loadDevGutSample}
                >
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 text-purple-500 flex items-center justify-center shrink-0">
                      <Dna className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-[13px] font-bold text-[var(--text-main)] leading-tight">Sample Gut Report</h5>
                      <span className="text-xs text-[var(--text-muted)]">Microbiome Panel PDF</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="accent" size="sm">49 Features</Badge>
                    <ChevronRight className="w-3.5 h-3.5 text-purple-400/60" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Uploaded File Cards Grid ── */}
            <ContentSection title={`Uploaded Files Queue (${selectedFiles.length})`}>
              {selectedFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedFiles.map((file, idx) => {
                    const modality = detectFileModality(file);
                    const modLabel = modality === 'clinical' ? 'CLINICAL' : (modality === 'gut_microbiome' ? 'GUT MICROBIOME' : 'WEARABLES');
                    const modVar = modality === 'clinical' ? 'primary' : (modality === 'gut_microbiome' ? 'accent' : 'secondary');
                    const modGradient = modality === 'clinical' ? 'from-blue-500/10 to-indigo-500/5'
                      : modality === 'gut_microbiome' ? 'from-purple-500/10 to-fuchsia-500/5'
                      : 'from-teal-500/10 to-cyan-500/5';

                    return (
                      <div key={idx} className={`intake-file-card rounded-xl p-3.5 border border-[var(--border-subtle)] bg-gradient-to-br ${modGradient} backdrop-blur-sm flex flex-col justify-between space-y-2.5`}>
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="p-2 rounded-lg bg-[var(--primary-light)] text-[var(--primary)] shrink-0">
                            {modality === 'gut_microbiome' ? <Dna className="w-4 h-4" /> : (modality === 'wearable/cgm' ? <Watch className="w-4 h-4" /> : <FileText className="w-4 h-4" />)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-[13px] font-semibold text-[var(--text-main)] truncate">{file.name}</h5>
                            <span className="text-xs font-mono text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                          <button onClick={() => handleRemoveFile(idx)} className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant={modVar} size="sm">{modLabel}</Badge>
                          <span className="text-xs font-mono text-[var(--success)] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-[var(--border-subtle)] p-8 text-center">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-3">
                    <UploadCloud className="w-6 h-6 text-[var(--text-muted)]" />
                  </div>
                  <h5 className="text-sm font-bold text-[var(--text-main)]">No Files Queued</h5>
                  <p className="text-[13px] text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
                    Upload your medical reports above or load sample data to populate the file queue.
                  </p>
                </div>
              )}
            </ContentSection>
          </div>

          {/* ── Right Sidebar: Live Summary Panel ── */}
          <div className="space-y-5">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/60 backdrop-blur-sm overflow-hidden">
              {/* Sidebar Header with gradient */}
              <div className="px-4 py-3.5 bg-gradient-to-r from-indigo-500/8 via-purple-500/8 to-cyan-500/8 border-b border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-indigo-500" />
                    Live Modality Summary
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3.5">
                {/* Modality Coverage — using inline styles for dynamic colors so Tailwind JIT can resolve them */}
                {(() => {
                  // P0 FIX: ONLY use current intake state
                  const hasClinFile = selectedFiles.some(f => detectFileModality(f) === 'clinical');
                  const hasClinForm = Object.values(formClinical || {}).some(v => v !== '' && v !== null && v !== undefined && !['Patient_ID', 'Gender'].includes(v));
                  const hasClinical = hasClinFile || hasClinForm || enableClinical;

                  const hasWearFile = selectedFiles.some(f => detectFileModality(f) === 'wearable/cgm');
                  const hasWearForm = Object.values(formWearable || {}).some(v => v !== '' && v !== null && v !== undefined);
                  const hasWearable = hasWearFile || hasWearForm || enableWearable;

                  const hasGutFile = selectedFiles.some(f => detectFileModality(f) === 'gut_microbiome');
                  const hasGutForm = Object.values(formGut || {}).some(v => v !== '' && v !== null && v !== undefined && v !== 0);
                  const hasGut = hasGutFile || hasGutForm || enableGut;

                  const modalities = [
                    { name: 'Clinical Lab', icon: <FileText className="w-4 h-4" />, active: hasClinical, iconColor: '#3b82f6', bgActive: 'rgba(59,130,246,0.06)', borderActive: 'rgba(59,130,246,0.2)' },
                    { name: 'Wearable Telemetry', icon: <Watch className="w-4 h-4" />, active: hasWearable, iconColor: '#14b8a6', bgActive: 'rgba(20,184,166,0.06)', borderActive: 'rgba(20,184,166,0.2)' },
                    { name: 'Gut Microbiome', icon: <Dna className="w-4 h-4" />, active: hasGut, iconColor: '#a855f7', bgActive: 'rgba(168,85,247,0.06)', borderActive: 'rgba(168,85,247,0.2)' },
                  ];

                  return (
                    <div className="space-y-2">
                      {modalities.map((mod) => (
                        <div
                          key={mod.name}
                          className="intake-sidebar-stat flex items-center justify-between p-3 rounded-xl border transition-all"
                          style={mod.active
                            ? { borderColor: mod.borderActive, background: mod.bgActive }
                            : { borderColor: 'var(--border-subtle)', background: 'var(--bg-primary)' }
                          }
                        >
                          <div className="flex items-center gap-2.5">
                            <span style={{ color: mod.iconColor }}>{mod.icon}</span>
                            <span className="text-[13px] font-semibold text-[var(--text-main)]">{mod.name}</span>
                          </div>
                          {mod.active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                            </span>
                          ) : (
                            <span className="text-xs font-mono text-[var(--text-muted)]">Not Provided</span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Divider */}
                <div className="border-t border-[var(--border-subtle)]" />

                {/* Data Quality Score */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-[var(--bg-primary)] to-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2.5">
                  {dqOverall !== null ? (
                    <>
                      <CircularProgress value={dqOverall} size={64} strokeWidth={5} variant="success" />
                      <div>
                        <p className="text-base font-extrabold text-[var(--text-main)]">{dqOverall}%</p>
                        <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">Data Quality Score</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-full border-2 border-dashed border-[var(--border-subtle)] flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-5 h-5 text-[var(--text-muted)]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--text-muted)]">Awaiting Data</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">Upload files to compute quality</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Security & Compliance footer */}
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                  <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium leading-snug">
                    All uploads encrypted with TLS 1.3 · Isolated sandbox processing
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: FEATURE VERIFICATION VIEW */}
      {currentStep === 2 && (
        <div className="space-y-6">
          
          {/* Anomaly & Conflict Auto-Resolution Banner */}
          {(Object.keys(verifyFlags || {}).length > 0 || Object.keys(conflictMap || {}).length > 0) && (
            <Card isGlass={true} className="p-5 border-l-4 border-l-[var(--warning)] bg-amber-500/10 space-y-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-500">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[var(--text-main)]">
                      Intake Anomalies & Conflicts Detected ({Object.keys(verifyFlags || {}).length + Object.keys(conflictMap || {}).length} items)
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Review physiological bounds and conflicting values below or click to auto-resolve all items into canonical features.
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleAutoResolveAllAnomalies}
                >
                  Auto-Resolve All Anomalies & Conflicts
                </Button>
              </div>
            </Card>
          )}

          {/* Feature Search Filter Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="w-full md:w-96 relative">
              <Input
                placeholder="Search canonical biomarker or taxa..."
                leftIcon={<Search className="w-4 h-4 text-[var(--primary)]" />}
                rightIcon={
                  featureSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => setFeatureSearchQuery('')}
                      className="p-1 hover:bg-[var(--bg-surface-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                      title="Clear Search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null
                }
                value={featureSearchQuery}
                onChange={(e) => setFeatureSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">Clinical: 18 Features</Badge>
              <Badge variant="secondary" size="sm">Wearables: 15 Features</Badge>
              <Badge variant="accent" size="sm">Gut: 49 Model Features</Badge>
            </div>
          </div>

          {/* Feature Verification Tabs & Accordion Tables */}
          <Tabs
            tabs={[
              {
                id: 'clinical_feats',
                label: 'Clinical Lab Biomarkers (18)',
                content: (() => {
                  const q = featureSearchQuery.trim().toLowerCase();
                  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
                  const filtered = CLINICAL_V4_FEATURES.filter(k => {
                    if (!tokens.length) return true;
                    const kLower = k.toLowerCase();
                    return tokens.every(t => kLower.includes(t));
                  });
                  const visible = showAllClinical ? filtered : filtered.slice(0, 7);
                  return (
                    <div className="space-y-3">
                      <Table headers={['Canonical Biomarker', 'Extracted Value', 'Physiological Bounds', 'Status & Provenance']}>
                        {visible.map((featKey) => {
                          const val = formClinical[featKey];
                          const isEdited = editedMap.has(`clinical.${featKey}`);
                          const bounds = CLIENT_PHYSIOLOGICAL_BOUNDS[featKey] || { min: 0, max: 1000, unit: 'units' };

                          return (
                            <TableRow key={featKey} className={isEdited ? 'bg-amber-500/5' : ''}>
                              <TableCell className="font-semibold text-xs">
                                <HighlightMatch text={featKey} query={featureSearchQuery} />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={val ?? ''}
                                  onChange={(e) => updateClinicalField(featKey, e.target.value)}
                                  className="!py-1 !px-2 text-xs font-mono max-w-[140px]"
                                />
                              </TableCell>
                              <TableCell className="font-mono text-xs text-[var(--text-muted)]">
                                {bounds.min} - {bounds.max} {bounds.unit}
                              </TableCell>
                              <TableCell>
                                <Badge variant={isEdited ? 'warning' : (val !== '' && val !== null && val !== undefined ? 'success' : 'info')} size="sm">
                                  {isEdited ? 'EDITED' : (val !== '' && val !== null && val !== undefined ? 'EXTRACTED' : 'MISSING')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </Table>
                      {filtered.length > 7 && (
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-[var(--text-muted)] font-mono">
                            Showing {visible.length} of {filtered.length} clinical biomarkers
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllClinical(!showAllClinical)}
                          >
                            {showAllClinical ? 'Show Less (Top 7)' : `Show All (${filtered.length}) Biomarkers`}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()
              },
              {
                id: 'wearable_feats',
                label: 'Wearable Telemetry (15)',
                content: (() => {
                  const q = featureSearchQuery.trim().toLowerCase();
                  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
                  const filtered = WEARABLE_V4_FEATURES.filter(k => {
                    if (!tokens.length) return true;
                    const kLower = k.toLowerCase();
                    return tokens.every(t => kLower.includes(t));
                  });
                  const visible = showAllWearable ? filtered : filtered.slice(0, 7);
                  return (
                    <div className="space-y-3">
                      <Table headers={['Telemetry Metric', 'Measured Value', 'Standard Unit', 'Status']}>
                        {visible.map((featKey) => {
                          const val = formWearable[featKey];
                          const isEdited = editedMap.has(`wearable.${featKey}`);
                          const bounds = CLIENT_PHYSIOLOGICAL_BOUNDS[featKey] || { unit: 'units' };

                          return (
                            <TableRow key={featKey} className={isEdited ? 'bg-amber-500/5' : ''}>
                              <TableCell className="font-semibold text-xs">
                                <HighlightMatch text={featKey} query={featureSearchQuery} />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={val ?? ''}
                                  onChange={(e) => updateWearableField(featKey, e.target.value)}
                                  className="!py-1 !px-2 text-xs font-mono max-w-[140px]"
                                />
                              </TableCell>
                              <TableCell className="font-mono text-xs text-[var(--text-muted)]">{bounds.unit || 'units'}</TableCell>
                              <TableCell>
                                <Badge variant={isEdited ? 'warning' : (val !== '' && val !== null && val !== undefined ? 'success' : 'info')} size="sm">
                                  {isEdited ? 'EDITED' : (val !== '' && val !== null && val !== undefined ? 'EXTRACTED' : 'MISSING')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </Table>
                      {filtered.length > 7 && (
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-[var(--text-muted)] font-mono">
                            Showing {visible.length} of {filtered.length} telemetry metrics
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAllWearable(!showAllWearable)}
                          >
                            {showAllWearable ? 'Show Less (Top 7)' : `Show All (${filtered.length}) Metrics`}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })()
              },
              {
                id: 'gut_feats',
                label: 'Gut Microbiome (49)',
                content: (() => {
                  const filteredTaxa = GUT_V4_TAXA_40.filter(t => t.toLowerCase().includes(featureSearchQuery.toLowerCase()) || t.toLowerCase().includes(taxaSearchQuery.toLowerCase()));
                  const TAXA_PER_PAGE = 10;
                  const totalPages = Math.ceil(filteredTaxa.length / TAXA_PER_PAGE);
                  const displayedTaxa = isShowingAllTaxa
                    ? filteredTaxa
                    : filteredTaxa.slice((currentPage - 1) * TAXA_PER_PAGE, currentPage * TAXA_PER_PAGE);

                  // Compositional Check Calculation
                  const taxaSum = GUT_V4_TAXA_40.reduce((acc, t) => acc + (parseFloat(formGut[t]) || 0.0), 0.0);
                  const otherVal = parseFloat(otherTaxa) || 0.0;
                  const totalCompositionSum = taxaSum + otherVal;
                  const isCompositionValid = totalCompositionSum >= 85.0 && totalCompositionSum <= 115.0;

                  // 9 Derived Indices Calculation
                  const derivedIndices = computeGutDerivedIndices(formGut);
                  const hasExtractedTaxa = GUT_V4_TAXA_40.some(t => formGut[t] !== '' && formGut[t] !== null && formGut[t] !== undefined);

                  return (
                    <div className="space-y-6">
                      {/* COMPOSITIONAL CHECK & SCHEMA PANEL */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--primary)]">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold font-mono uppercase text-[var(--text-muted)]">Compositional Sum Validation</h5>
                            <Badge variant={isCompositionValid ? 'success' : 'warning'} size="sm">
                              {isCompositionValid ? 'VALIDATED (100% ± 15%)' : `SUM = ${totalCompositionSum.toFixed(1)}%`}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text-muted)]">40 Species Taxa Sum: <strong className="text-[var(--text-main)] font-mono">{taxaSum.toFixed(2)}%</strong></span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[var(--text-muted)]">Other_Taxa:</span>
                              <Input
                                value={otherTaxa}
                                onChange={(e) => setOtherTaxa(e.target.value)}
                                className="!py-0.5 !px-1.5 text-xs font-mono w-16 text-right"
                              />
                              <span className="text-[var(--text-muted)]">%</span>
                            </div>
                          </div>
                          <ProgressBar value={Math.min(totalCompositionSum, 100)} variant={isCompositionValid ? 'success' : 'warning'} className="h-1.5" />
                          
                          <Button
                            variant={isCompositionValid ? 'outline' : 'warning'}
                            size="sm"
                            className="w-full mt-2 text-xs !py-1"
                            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                            onClick={() => handleNormalizeGutTaxa(taxaSum)}
                          >
                            ⚡ Auto-Normalize 40 Taxa Abundances to 100.0%
                          </Button>
                        </Card>


                        <Card isGlass={true} className="p-4 space-y-2 border-l-4 border-l-[var(--accent)]">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold font-mono uppercase text-[var(--text-muted)]">Model Schema Status</h5>
                            <Badge variant="accent" size="sm">49 Model Features</Badge>
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">
                            Includes <strong className="text-[var(--text-main)]">40 Canonical Species Taxa</strong> + <strong className="text-[var(--text-main)]">Other_Taxa</strong> + <strong className="text-[var(--text-main)]">9 Auto-Computed Derived Indices</strong>.
                          </p>
                        </Card>
                      </div>

                      {/* CONTROLS BAR */}
                      <Card isGlass={true} className="p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 w-full max-w-sm relative">
                            <Input
                              placeholder="Search 40 V4 Taxa species..."
                              leftIcon={<Search className="w-4 h-4 text-[var(--accent)]" />}
                              rightIcon={
                                taxaSearchQuery ? (
                                  <button
                                    type="button"
                                    onClick={() => setTaxaSearchQuery('')}
                                    className="p-1 hover:bg-[var(--bg-surface-hover)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                                    title="Clear Search"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                ) : null
                              }
                              value={taxaSearchQuery}
                              onChange={(e) => setTaxaSearchQuery(e.target.value)}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-[var(--text-muted)] font-mono hidden sm:inline">
                              Showing {displayedTaxa.length} of {filteredTaxa.length} Taxa (49 Model Features)
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsShowingAllTaxa(!isShowingAllTaxa)}
                            >
                              {isShowingAllTaxa ? 'Show Paginated (10/page)' : `Show All (${filteredTaxa.length}) Taxa`}
                            </Button>
                          </div>
                        </div>

                        {/* TAXA TABLE */}
                        <Table headers={['Taxon Species Name', 'Relative Abundance (%)', 'Unit', 'Status', 'Details']}>
                          {displayedTaxa.map((featKey) => {
                            const val = formGut[featKey];
                            const isEdited = editedMap.has(`gut.${featKey}`);

                            return (
                              <TableRow key={featKey} className={isEdited ? 'bg-purple-500/5' : ''}>
                                <TableCell className="font-semibold text-xs font-mono text-[var(--text-main)]">
                                  <HighlightMatch text={featKey} query={taxaSearchQuery || featureSearchQuery} />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    value={val ?? ''}
                                    onChange={(e) => updateGutField(featKey, e.target.value)}
                                    className="!py-1 !px-2 text-xs font-mono max-w-[140px]"
                                  />
                                </TableCell>
                                <TableCell className="font-mono text-xs text-[var(--text-muted)]">%</TableCell>
                                <TableCell>
                                  <Badge variant={isEdited ? 'warning' : (val !== '' && val !== null && val !== undefined ? 'accent' : 'info')} size="sm">
                                    {isEdited ? 'EDITED' : (val !== '' && val !== null && val !== undefined ? 'EXTRACTED' : 'MISSING')}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-[10px] text-[var(--text-muted)] font-mono">
                                  V4 Canonical Taxon
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </Table>

                        {/* PAGINATION FOOTER */}
                        {!isShowingAllTaxa && totalPages > 1 && (
                          <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)]">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                              Previous
                            </Button>

                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                                <button
                                  key={pg}
                                  onClick={() => setCurrentPage(pg)}
                                  className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                                    currentPage === pg
                                      ? 'bg-[var(--primary)] text-white'
                                      : 'bg-[var(--bg-primary)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)]'
                                  }`}
                                >
                                  {pg}
                                </button>
                              ))}
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </Card>

                      {/* DERIVED INDICES PANEL */}
                      <Card isGlass={true} className="p-5 space-y-4 border border-[var(--accent)]/30">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                              <Dna className="w-4 h-4 text-purple-400" />
                              Derived Ecological & Functional Indices (Computed)
                            </h4>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              These 9 indices are computed automatically from the uploaded V4 taxa abundance data.
                            </p>
                          </div>
                          <Badge variant={hasExtractedTaxa ? 'success' : 'info'} size="sm">
                            {hasExtractedTaxa ? 'Computed / Ready' : 'Computed / Pending'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {GUT_V4_INDICES_9.map((idxKey) => (
                            <div key={idxKey} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1">
                              <span className="text-[11px] font-semibold text-[var(--text-muted)] block truncate">{idxKey}</span>
                              <div className="flex items-baseline justify-between">
                                <span className="text-sm font-mono font-extrabold text-[var(--text-main)]">
                                  {formGut[idxKey] !== undefined && formGut[idxKey] !== '' ? formGut[idxKey] : (derivedIndices[idxKey] !== undefined ? derivedIndices[idxKey] : '0.00')}
                                </span>
                                <span className="text-[10px] font-mono text-[var(--success)] font-semibold">AUTO</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  );
                })()
              }
            ]}
          />
        </div>
      )}

      {/* STEP 3: RUN ANALYSIS & ENTERPRISE AI PIPELINE VISUALIZATION */}
      {currentStep === 3 && (
        <AnalysisPipeline
          stage={journeyStage === 'completed' ? 'completed' : loading ? 'predicting' : 'intake'}
          errorMsg={errorMsg}
          warningMsg={differentPatientWarning}
          pathway={session?.effective_pathway || 'C+W+G'}
          dqScore={dqOverall}
          featureCounts={{
            clinical: Object.keys(formClinical).filter(k => formClinical[k] !== '' && formClinical[k] !== null).length,
            wearable: Object.keys(formWearable).filter(k => formWearable[k] !== '' && formWearable[k] !== null).length,
            gut: (() => {
              const directCount = Object.keys(formGut).filter(k => formGut[k] !== '' && formGut[k] !== null).length;
              if (directCount >= 49) return 49;
              const hasTaxa = GUT_V4_TAXA_40.some(t => formGut[t] !== '' && formGut[t] !== null);
              if (hasTaxa) return 49;
              return directCount;
            })(),
          }}
          currentDocument={selectedFiles[0]?.name || 'apollo_clinical_lab_sample.pdf'}
          onNavigateDashboard={() => navigate('/dashboard')}
          onNavigateXAI={() => navigate('/xai')}
          onNavigateReport={() => navigate('/report')}
          onRetry={handleConfirmAndRunML}
          onBackToVerification={() => setCurrentStep(2)}
        />
      )}

      {/* ALWAYS VISIBLE BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 left-0 lg:left-[var(--sidebar-width)] right-0 transition-all duration-300 z-[var(--z-header)] bg-[var(--bg-surface)]/90 backdrop-blur-md border-t border-[var(--border-subtle)] p-4 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 md:px-8">
          <Button
            variant="outline"
            size="md"
            isDisabled={currentStep <= 1 || loading}
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          >
            ← Back
          </Button>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md" onClick={handleFullReset}>
              Reset / Save Draft
            </Button>

            {currentStep === 1 && (
              <Button
                variant="primary"
                size="md"
                isLoading={loading}
                isDisabled={selectedFiles.length === 0 && !enableClinical && !enableWearable && !enableGut}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={handleProceedToReview}
              >
                Continue to Verify Features →
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                variant="primary"
                size="md"
                isLoading={loading}
                rightIcon={<Brain className="w-4 h-4" />}
                onClick={handlePreConfirmCheck}
              >
                Confirm & Run Analysis →
              </Button>
            )}

            {currentStep === 3 && journeyStage === 'completed' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => navigate('/dashboard')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View Prediction Results →
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCaptureFile={(f) => handleAddFiles([f])}
      />

      {/* Why Quality Modal */}
      <WhyQualityModal
        isOpen={isQualityModalOpen}
        onClose={() => setIsQualityModalOpen(false)}
        score={dqOverall}
        metadata={fileStatuses}
        verifyFlags={verifyFlags}
      />

      {/* HITL Missing Feature Validation Modal */}
      <MissingFeatureModal
        isOpen={showMissingModal}
        onClose={() => setShowMissingModal(false)}
        missingFields={pendingMissingFields}
        allFeatures={{
          clinical: enableClinical ? CLINICAL_V4_FEATURES : [],
          wearable: enableWearable ? WEARABLE_V4_FEATURES : [],
          gut: enableGut ? GUT_V4_TOTAL_FEATURES : []
        }}
        onConfirm={handleMissingModalConfirm}
        onSkipAll={handleMissingModalSkip}
      />
    </PageContainer>
  );
}
