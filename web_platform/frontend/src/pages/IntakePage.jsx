import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud, Camera, FileText, CheckCircle2, AlertCircle, Trash2, ArrowRight, ShieldCheck,
  Activity, Watch, Dna, RefreshCw, ChevronRight, Sliders, Check, Eye, Edit3, Sparkles, AlertTriangle, HelpCircle, ShieldAlert, Info, Search, FileSpreadsheet, Lock, Brain
} from 'lucide-react';
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
import { normalizeRawKey, normalizeExtractedDict, CLIENT_PHYSIOLOGICAL_BOUNDS, validateClientField } from '../utils/intakeValidation';
import { GUT_PDF_B64, WEAR_PDF_B64, CLIN_PDF_B64, b64ToFile } from '../dev_pdfs';

export default function IntakePage({
  session,
  setSession,
  onAnalysisComplete,
  onInvalidateDownstream,
  onResetSession,
  activeSubNav
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

  const fileInputRef = useRef(null);

  // Modality Toggles
  const [enableClinical, setEnableClinical] = useState(true);
  const [enableWearable, setEnableWearable] = useState(false);
  const [enableCGM, setEnableCGM] = useState(false);
  const [enableGut, setEnableGut] = useState(false);

  // EMPTY initial canonical schema states
  const emptyClinical = {
    Patient_ID: '', Age: '', Gender: '', Height: '', Weight: '', BMI: '', Waist_Circumference: '',
    Systolic_BP: '', Diastolic_BP: '', Fasting_Blood_Glucose: '', HbA1c: '',
    Triglycerides: '', HDL: '', LDL: '', ALT: '', AST: '',
    Family_History_Diabetes: '', Family_History_Hypertension: '', Family_History_CVD: ''
  };

  const emptyWearable = {
    Average_Daily_Steps: '', Active_Minutes: '', Sedentary_Time_Minutes: '',
    Resting_Heart_Rate: '', Heart_Rate_Variability_RMSSD: '', Sleep_Duration: '',
    Sleep_Efficiency_Score: '', Autonomic_Stress_Score: '', Calories_Burned: '', Exercise_Frequency_Days: '',
    Average_Glucose: '', Glucose_Variability: '', Time_In_Range: '', Time_Above_Range: '',
    CGM_Average_Glucose: '', CGM_Glucose_CV: '', CGM_Time_In_Range: '', CGM_Time_Above_Range: ''
  };

  const emptyGut = {
    Shannon_Diversity_Index: '', Firmicutes: '', Bacteroidetes: '', Proteobacteria: '',
    Akkermansia: '', Faecalibacterium: '', Bifidobacterium: '', Roseburia: '',
    Bacteroides: '', Prevotella: '', Blautia: '', Collinsella: '',
    Escherichia_Shigella: '', Alistipes: '', Ruminococcus: '', Coprococcus: '',
    Subdoligranulum: '', Enterococcus: '', Eubacterium: '', Parabacteroides: '',
    Lactobacillus: '', Klebsiella: '', Streptococcus: '', Eggerthella: ''
  };

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
  const [uploadStage, setUploadStage] = useState(null);
  const [journeyStage, setJourneyStage] = useState('intake');

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
    if (onResetSession) onResetSession();
  };

  // Add files safely
  const handleAddFiles = (filesList) => {
    const newFiles = Array.from(filesList || []);
    if (!newFiles.length) return;
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setErrorMsg(null);

    newFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
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

  // Step 1 -> Step 2: Process files and normalize canonical fields
  const handleProceedToReview = async () => {
    setErrorMsg(null);
    if (selectedFiles.length > 0) {
      setLoading(true);
      setUploadStage('uploading');
      try {
        setUploadStage('detecting');
        const res = await uploadReports(selectedFiles, session?.session_id);

        setUploadStage('extracting');
        const rawExtracted = res.extracted_features || {};

        setUploadStage('normalizing');
        const normClinical = normalizeExtractedDict(rawExtracted.clinical || {});
        const normWearable = normalizeExtractedDict(rawExtracted.wearable || {});
        const normGut = normalizeExtractedDict(rawExtracted.gut || {});

        setUploadStage('validating');
        setVerifyFlags(res.verify_flags || {});
        setConflictMap(res.conflict_map || {});
        setDifferentPatientWarning(res.different_patient_warning || null);
        setFileStatuses(res.processed_reports_metadata || []);

        setUploadStage('dq');
        setQualityScores(res.data_quality_scores || null);
        setProvenanceMap(res.provenance || {});

        const hasPrimaryClinical = Object.keys(normClinical).some(k => !['Patient_ID', 'Age', 'Gender'].includes(k) && normClinical[k] !== '' && normClinical[k] !== null && normClinical[k] !== undefined);
        const hasExtractedClinical = hasPrimaryClinical;
        const hasExtractedWearable = Object.keys(normWearable).some(k => normWearable[k] !== '' && normWearable[k] !== null && normWearable[k] !== undefined);
        const hasExtractedGut = Object.keys(normGut).some(k => normGut[k] !== '' && normGut[k] !== null && normGut[k] !== undefined);

        // Merge Clinical
        if (hasExtractedClinical || Object.keys(normClinical).length > 0) {
          setFormClinical((prev) => {
            const next = { ...emptyClinical, ...prev };
            Object.entries(normClinical).forEach(([k, extVal]) => {
              if (extVal !== '' && extVal !== null && extVal !== undefined) next[k] = extVal;
            });
            return next;
          });
        }

        // Merge Wearable
        if (hasExtractedWearable) {
          if (Object.keys(normWearable).some(k => k.startsWith('Average_Glucose') || k.startsWith('Glucose_Variability') || k.startsWith('Time_In_Range') || k.startsWith('Time_Above_Range') || k.startsWith('CGM_'))) setEnableCGM(true);
          setFormWearable((prev) => {
            const next = { ...emptyWearable, ...prev };
            Object.entries(normWearable).forEach(([k, extVal]) => {
              if (extVal !== '' && extVal !== null && extVal !== undefined) next[k] = extVal;
            });
            return next;
          });
        }

        // Merge Gut
        if (hasExtractedGut) {
          setFormGut((prev) => {
            const next = { ...emptyGut, ...prev };
            Object.entries(normGut).forEach(([k, extVal]) => {
              if (extVal !== '' && extVal !== null && extVal !== undefined) next[k] = extVal;
            });
            return next;
          });
        }

        setEnableClinical(hasExtractedClinical);
        setEnableWearable(hasExtractedWearable);
        setEnableGut(hasExtractedGut);

        setExtractedMap((prevMap) => ({
          clinical: { ...prevMap.clinical, ...normClinical },
          wearable: { ...prevMap.wearable, ...normWearable },
          gut: { ...prevMap.gut, ...normGut }
        }));

        setSession({
          session_id: res.session_id,
          status: 'EXTRACTED',
          extracted_features: {
            clinical: { ...(extractedMap.clinical || {}), ...normClinical },
            wearable: { ...(extractedMap.wearable || {}), ...normWearable },
            gut: { ...(extractedMap.gut || {}), ...normGut }
          },
          data_quality_scores: res.data_quality_scores
        });
        setUploadStage('ready');
        setCurrentStep(2);
      } catch (err) {
        setErrorMsg(`Report processing failed: ${err.message || 'Server error during intake parsing'}`);
        setUploadStage(null);
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

  // Step 2 -> Step 3: Confirm features and execute ML prediction
  const handleConfirmAndRunML = async () => {
    if (Object.keys(verifyFlags).length > 0 || Object.keys(conflictMap).length > 0) {
      setErrorMsg('Please resolve all critical VERIFY anomalies and CONFLICT items before running V3 prediction.');
      return;
    }

    const cleanClinicalDict = (dict) => {
      if (!dict) return null;
      const primaryLabKeys = [
        'Height', 'Weight', 'BMI', 'Waist_Circumference', 'Systolic_BP', 'Diastolic_BP',
        'Fasting_Blood_Glucose', 'HbA1c', 'Triglycerides', 'HDL', 'LDL', 'ALT', 'AST',
        'Family_History_Diabetes', 'Family_History_Hypertension', 'Family_History_CVD'
      ];
      const hasPrimary = Object.keys(dict).some(k => primaryLabKeys.includes(k) && dict[k] !== '' && dict[k] !== null && dict[k] !== undefined);
      if (!hasPrimary) return null;

      const res = {};
      Object.entries(dict).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined && k !== 'Patient_ID') {
          let numVal = v;
          if (k === 'Gender') {
            numVal = (v === 'Male' || v === 1 || v === '1') ? 1 : 0;
          } else if (typeof v === 'string' && !isNaN(parseFloat(v))) {
            numVal = parseFloat(v);
          }
          res[k] = numVal;
        }
      });
      return Object.keys(res).length > 0 ? res : null;
    };

    const confirmedPayload = {
      clinical: cleanClinicalDict(formClinical),
      wearable: cleanDict(formWearable),
      gut: cleanDict(formGut)
    };

    if (!confirmedPayload.clinical && !confirmedPayload.wearable && !confirmedPayload.gut) {
      setErrorMsg('Please populate at least one valid modality (Clinical, Wearable, or Gut) before running inference.');
      return;
    }

    setLoading(true);
    setJourneyStage('predicting');
    setCurrentStep(3);
    try {
      const predRes = await confirmFeatures(confirmedPayload, session?.session_id);
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

  // Helper Sample PDF loaders
  const loadDevClinSample = () => {
    const f = b64ToFile(CLIN_PDF_B64, 'apollo_clinical_lab_sample.pdf');
    handleAddFiles([f]);
  };
  const loadDevWearSample = () => {
    const f = b64ToFile(WEAR_PDF_B64, 'fitbit_wearable_telemetry_sample.pdf');
    handleAddFiles([f]);
  };
  const loadDevGutSample = () => {
    const f = b64ToFile(GUT_PDF_B64, 'ayumetrix_gut_microbiome_sample.pdf');
    handleAddFiles([f]);
  };

  const dqOverall = qualityScores?.overall_quality_score || 85.2;

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
      {/* Page Header & Stepper */}
      <PageHeader
        title="Intake & Data Ingestion Workspace"
        description="IMDIE v3.3 Multimodal File Detection, Hybrid PDF OCR, Canonical Alias Mapping & Quality Scorer"
        badge="Phase 1 Engine Active"
      />

      {renderHorizontalStepper()}

      {/* Global Error Banner */}
      {errorMsg && (
        <Alert variant="danger" title="Intake Processing Alert" icon={<ShieldAlert className="w-5 h-5" />}>
          {errorMsg}
        </Alert>
      )}

      {/* STEP 1: UPLOAD REPORTS VIEW */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Drag & Drop Card Zone */}
            <Card isGlass={true} className="p-8 text-center border-2 border-dashed border-[var(--primary)]/40 hover:border-[var(--primary)] transition-all">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.csv,.txt,image/*"
                onChange={(e) => handleAddFiles(e.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center animate-pulse">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-main)]">Drag & Drop Medical Files or Click to Browse</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 max-w-md mx-auto">
                    Supported: Apollo Lab PDF, Max Healthcare PDF, Thyrocare PDF, Fitbit/Garmin/Apple Watch CSV, Ayumetrix Gut PDF
                  </p>
                </div>

                {/* Format Chips & Badges */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <Badge variant="primary" size="sm">PDF / CSV / TXT / PNG</Badge>
                  <Badge variant="secondary" size="sm">25 MB Max</Badge>
                  <Badge variant="success" size="sm"><Lock className="w-3 h-3 mr-1 inline" /> HIPAA Encrypted</Badge>
                  <Badge variant="accent" size="sm"><ShieldCheck className="w-3 h-3 mr-1 inline" /> Magic Byte Verified</Badge>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Button variant="primary" size="md" leftIcon={<UploadCloud className="w-4 h-4" />} onClick={() => fileInputRef.current?.click()}>
                    Browse Local Files
                  </Button>
                  <Button variant="outline" size="md" leftIcon={<Camera className="w-4 h-4" />} onClick={() => setIsCameraOpen(true)}>
                    Scan via Camera
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Sample Dataset Shortcuts */}
            <Card isGlass={true} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-mono uppercase font-bold text-[var(--text-muted)]">Instant Test Dataset Shortcuts</h4>
                <Badge variant="info" size="sm">Pre-built Dev Files</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button variant="outline" size="sm" className="!justify-start text-xs" leftIcon={<FileText className="w-4 h-4 text-blue-500" />} onClick={loadDevClinSample}>
                  Apollo Clinical PDF
                </Button>
                <Button variant="outline" size="sm" className="!justify-start text-xs" leftIcon={<FileSpreadsheet className="w-4 h-4 text-teal-500" />} onClick={loadDevWearSample}>
                  Fitbit Wearables CSV
                </Button>
                <Button variant="outline" size="sm" className="!justify-start text-xs" leftIcon={<Dna className="w-4 h-4 text-purple-500" />} onClick={loadDevGutSample}>
                  Ayumetrix Gut PDF
                </Button>
              </div>
            </Card>

            {/* Uploaded File Cards Grid */}
            <ContentSection title={`Uploaded Files Queue (${selectedFiles.length})`}>
              {selectedFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedFiles.map((file, idx) => {
                    const isPdf = file.name.endsWith('.pdf');
                    const isCsv = file.name.endsWith('.csv');
                    const modType = isCsv ? 'Wearables' : (file.name.toLowerCase().includes('gut') || file.name.toLowerCase().includes('ayumetrix') ? 'Gut Microbiome' : 'Clinical Lab');
                    const modVar = isCsv ? 'secondary' : (modType === 'Gut Microbiome' ? 'accent' : 'primary');

                    return (
                      <Card key={idx} isGlass={true} className="p-4 flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="p-2.5 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] shrink-0">
                            {isCsv ? <FileSpreadsheet className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-[var(--text-main)] truncate">{file.name}</h5>
                            <span className="text-[10px] font-mono text-[var(--text-muted)]">{(file.size / 1024).toFixed(1)} KB</span>
                          </div>
                          <button onClick={() => handleRemoveFile(idx)} className="text-[var(--text-muted)] hover:text-[var(--danger)] p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between">
                          <Badge variant={modVar} size="sm">{modType}</Badge>
                          <span className="text-[10px] font-mono text-[var(--success)] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={<UploadCloud className="w-8 h-8 text-[var(--text-muted)]" />}
                  title="No Files Queued"
                  description="Upload your medical reports above to populate the file queue."
                />
              )}
            </ContentSection>
          </div>

          {/* Right Live Upload Summary Panel */}
          <div className="space-y-6">
            <Card isGlass={true} className="p-6 space-y-6">
              <CardHeader className="!mb-0 !pb-2">
                <h4 className="text-sm font-bold text-[var(--text-main)]">Live Modality Summary</h4>
                <Badge variant="primary" size="sm">Real-time Data</Badge>
              </CardHeader>

              <CardBody className="space-y-4">
                {/* Modality Coverage List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-semibold text-[var(--text-main)]">Clinical Lab PDF</span>
                    </div>
                    <Badge variant={selectedFiles.some(f => !f.name.endsWith('.csv') && !f.name.toLowerCase().includes('gut')) ? 'success' : 'info'} size="sm">
                      {selectedFiles.some(f => !f.name.endsWith('.csv') && !f.name.toLowerCase().includes('gut')) ? 'Uploaded' : 'Missing'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <Watch className="w-4 h-4 text-teal-500" />
                      <span className="text-xs font-semibold text-[var(--text-main)]">Wearables CSV</span>
                    </div>
                    <Badge variant={selectedFiles.some(f => f.name.endsWith('.csv')) ? 'success' : 'info'} size="sm">
                      {selectedFiles.some(f => f.name.endsWith('.csv')) ? 'Uploaded' : 'Optional'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <Dna className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-semibold text-[var(--text-main)]">Gut Microbiome PDF</span>
                    </div>
                    <Badge variant={selectedFiles.some(f => f.name.toLowerCase().includes('gut')) ? 'success' : 'info'} size="sm">
                      {selectedFiles.some(f => f.name.toLowerCase().includes('gut')) ? 'Uploaded' : 'Optional'}
                    </Badge>
                  </div>
                </div>

                {/* Data Quality Score Preview */}
                <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center space-y-2">
                  <CircularProgress value={dqOverall} size={64} strokeWidth={6} variant="success" />
                  <p className="text-xs font-mono font-bold text-[var(--text-main)]">Estimated Quality: {dqOverall}%</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Synthesizing file structure & physiological bounds.</p>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* STEP 2: FEATURE VERIFICATION VIEW */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Feature Search Filter Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="w-full md:w-96">
              <Input
                placeholder="Search canonical biomarker or taxa..."
                leftIcon={<Search className="w-4 h-4" />}
                value={featureSearchQuery}
                onChange={(e) => setFeatureSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">Clinical: {Object.keys(formClinical).length}</Badge>
              <Badge variant="secondary" size="sm">Wearables: {Object.keys(formWearable).length}</Badge>
              <Badge variant="accent" size="sm">Gut: {Object.keys(formGut).length}</Badge>
            </div>
          </div>

          {/* Feature Verification Tabs & Accordion Tables */}
          <Tabs
            tabs={[
              {
                id: 'clinical_feats',
                label: 'Clinical Lab Biomarkers',
                content: (
                  <Table headers={['Canonical Biomarker', 'Extracted Value', 'Physiological Bounds', 'Status & Provenance']}>
                    {Object.keys(formClinical)
                      .filter(k => k.toLowerCase().includes(featureSearchQuery.toLowerCase()))
                      .map((featKey) => {
                        const val = formClinical[featKey];
                        const isEdited = editedMap.has(`clinical.${featKey}`);
                        const bounds = CLIENT_PHYSIOLOGICAL_BOUNDS[featKey] || { min: 0, max: 1000, unit: 'units' };

                        return (
                          <TableRow key={featKey} className={isEdited ? 'bg-amber-500/5' : ''}>
                            <TableCell className="font-semibold text-xs">{featKey}</TableCell>
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
                              <Badge variant={isEdited ? 'warning' : (val !== '' && val !== null ? 'success' : 'info')} size="sm">
                                {isEdited ? 'EDITED' : (val !== '' && val !== null ? 'EXTRACTED' : 'MISSING')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </Table>
                )
              },
              {
                id: 'wearable_feats',
                label: 'Wearable Telemetry',
                content: (
                  <Table headers={['Telemetry Metric', 'Measured Value', 'Standard Unit', 'Status']}>
                    {Object.keys(formWearable)
                      .filter(k => k.toLowerCase().includes(featureSearchQuery.toLowerCase()))
                      .map((featKey) => {
                        const val = formWearable[featKey];
                        const isEdited = editedMap.has(`wearable.${featKey}`);

                        return (
                          <TableRow key={featKey} className={isEdited ? 'bg-amber-500/5' : ''}>
                            <TableCell className="font-semibold text-xs">{featKey}</TableCell>
                            <TableCell>
                              <Input
                                value={val ?? ''}
                                onChange={(e) => updateWearableField(featKey, e.target.value)}
                                className="!py-1 !px-2 text-xs font-mono max-w-[140px]"
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs text-[var(--text-muted)]">units</TableCell>
                            <TableCell>
                              <Badge variant={isEdited ? 'warning' : (val !== '' && val !== null ? 'success' : 'info')} size="sm">
                                {isEdited ? 'EDITED' : (val !== '' && val !== null ? 'EXTRACTED' : 'MISSING')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </Table>
                )
              },
              {
                id: 'gut_feats',
                label: 'Gut Microbiome Taxa',
                content: (
                  <Table headers={['Microbial Taxa Name', 'Relative Abundance (%)', 'Unit', 'Status']}>
                    {Object.keys(formGut)
                      .filter(k => k.toLowerCase().includes(featureSearchQuery.toLowerCase()))
                      .map((featKey) => {
                        const val = formGut[featKey];
                        const isEdited = editedMap.has(`gut.${featKey}`);

                        return (
                          <TableRow key={featKey} className={isEdited ? 'bg-amber-500/5' : ''}>
                            <TableCell className="font-semibold text-xs">{featKey}</TableCell>
                            <TableCell>
                              <Input
                                value={val ?? ''}
                                onChange={(e) => updateGutField(featKey, e.target.value)}
                                className="!py-1 !px-2 text-xs font-mono max-w-[140px]"
                              />
                            </TableCell>
                            <TableCell className="font-mono text-xs text-[var(--text-muted)]">%</TableCell>
                            <TableCell>
                              <Badge variant={isEdited ? 'warning' : (val !== '' && val !== null ? 'accent' : 'info')} size="sm">
                                {isEdited ? 'EDITED' : (val !== '' && val !== null ? 'EXTRACTED' : 'MISSING')}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </Table>
                )
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
            gut: Object.keys(formGut).filter(k => formGut[k] !== '' && formGut[k] !== null).length,
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
      <div className="fixed bottom-0 left-0 right-0 z-[var(--z-header)] bg-[var(--bg-surface)]/90 backdrop-blur-md border-t border-[var(--border-subtle)] p-4 shadow-2xl">
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
                onClick={handleConfirmAndRunML}
              >
                Confirm & Run Analysis →
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
    </PageContainer>
  );
}
