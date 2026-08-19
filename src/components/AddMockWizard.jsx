// src/components/AddMockWizard.jsx
import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { addMock, addMockSubjectResults, addErrorLog } from '../services/db';

const ERROR_TYPES = [
  'Concept Gap',
  'Calculation Mistake',
  'Silly Mistake',
  'Misread Question',
  'Time Pressure',
  'Guess',
  'Forgot Formula/Rule',
  'Confusion Between Concepts',
  'Unattempted',
  'Other'
];

export default function AddMockWizard({ onClose, onSuccess, areas, subjects, topics }) {
  const [step, setStep] = useState(1); // 1: Overview, 2: Subjects, 3: Errors
  const [mockForm, setMockForm] = useState({
    preparationAreaId: areas.length > 0 ? areas[0].id : '',
    mockNumber: 1,
    date: new Date().toISOString().slice(0, 10),
    positiveMarks: 1,
    negativeMarks: 0.25,
    notes: ''
  });

  const [subjectResults, setSubjectResults] = useState([]);
  const [errors, setErrors] = useState([]);

  // Auto-populate subjects when area changes or on load
  React.useEffect(() => {
    if (mockForm.preparationAreaId) {
      const areaSubjects = subjects.filter(s => s.preparationAreaId === parseInt(mockForm.preparationAreaId));
      setSubjectResults(areaSubjects.map(s => ({
        subjectId: s.id,
        name: s.name,
        attempted: 0,
        correct: 0,
        wrong: 0,
        unattempted: 0,
        timeTaken: 0
      })));
    }
  }, [mockForm.preparationAreaId, subjects]);

  const handleNext = () => {
    if (step === 1) {
      if (!mockForm.preparationAreaId) return alert('Please select a preparation area.');
      setStep(2);
    } else if (step === 2) {
      // Validate subject math
      let isValid = true;
      for (const sr of subjectResults) {
        if (sr.attempted !== (sr.correct + sr.wrong)) {
          alert(`In ${sr.name}, Attempted must equal Correct + Wrong.`);
          isValid = false;
          break;
        }
      }
      if (isValid) setStep(3);
    }
  };

  const handleAddError = () => {
    setErrors([...errors, {
      subjectId: subjectResults.length > 0 ? subjectResults[0].subjectId : '',
      topicId: '',
      errorType: 'Concept Gap',
      questionRef: '',
      userAnswer: '',
      correctAnswer: '',
      notes: '',
      revisionRequired: true
    }]);
  };

  const handleSave = async () => {
    try {
      // 1. Calculate overall mock totals from subject results
      let totalAttempted = 0;
      let totalCorrect = 0;
      let totalWrong = 0;
      let totalUnattempted = 0;

      subjectResults.forEach(r => {
        totalAttempted += r.attempted;
        totalCorrect += r.correct;
        totalWrong += r.wrong;
        totalUnattempted += r.unattempted;
      });

      const totalQuestions = totalAttempted + totalUnattempted;
      const score = (totalCorrect * mockForm.positiveMarks) - (totalWrong * mockForm.negativeMarks);
      const maxScore = totalQuestions * mockForm.positiveMarks;

      // 2. Save Mock
      const mockId = await addMock({
        ...mockForm,
        preparationAreaId: parseInt(mockForm.preparationAreaId),
        mockNumber: parseInt(mockForm.mockNumber),
        attempted: totalAttempted,
        correct: totalCorrect,
        wrong: totalWrong,
        unattempted: totalUnattempted,
        score: Math.max(0, score),
        maxScore: maxScore
      });

      // 3. Save Subject Results
      const resultsToSave = subjectResults.map(({ name, ...rest }) => ({
        ...rest,
        mockTestId: mockId
      }));
      await addMockSubjectResults(resultsToSave);

      // 4. Save Errors
      for (const err of errors) {
        if (err.topicId) {
          await addErrorLog({
            mockTestId: mockId,
            subjectId: parseInt(err.subjectId),
            topicId: parseInt(err.topicId),
            errorType: err.errorType,
            questionRef: err.questionRef,
            userAnswer: err.userAnswer,
            correctAnswer: err.correctAnswer,
            notes: err.notes,
            revisionRequired: err.revisionRequired
          });
        }
      }

      onSuccess();
    } catch (e) {
      alert("Error saving mock: " + e.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 800 }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {step === 1 && "Step 1: Mock Overview"}
            {step === 2 && "Step 2: Subject Results"}
            {step === 3 && "Step 3: Question Errors"}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        
        {/* Progress Bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 4, background: step >= 1 ? 'var(--primary)' : 'var(--border)', borderRadius: 2 }} />
          <div style={{ flex: 1, height: 4, background: step >= 2 ? 'var(--primary)' : 'var(--border)', borderRadius: 2 }} />
          <div style={{ flex: 1, height: 4, background: step >= 3 ? 'var(--primary)' : 'var(--border)', borderRadius: 2 }} />
        </div>

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 10 }}>
          {step === 1 && (
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Preparation Area</label>
                <select className="form-input" value={mockForm.preparationAreaId} onChange={(e) => setMockForm({ ...mockForm, preparationAreaId: e.target.value })}>
                  {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Mock Number/Name</label>
                <input type="number" className="form-input" value={mockForm.mockNumber} onChange={(e) => setMockForm({ ...mockForm, mockNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={mockForm.date} onChange={(e) => setMockForm({ ...mockForm, date: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Marking Scheme (+ / -)</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" step="0.1" className="form-input" placeholder="+ Correct" value={mockForm.positiveMarks} onChange={(e) => setMockForm({ ...mockForm, positiveMarks: parseFloat(e.target.value) })} />
                  <input type="number" step="0.1" className="form-input" placeholder="- Wrong" value={mockForm.negativeMarks} onChange={(e) => setMockForm({ ...mockForm, negativeMarks: parseFloat(e.target.value) })} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {subjectResults.map((sr, idx) => (
                <div key={sr.subjectId} className="card" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--primary)' }}>{sr.name}</div>
                  <div className="grid-4" style={{ gap: 8 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 11 }}>Correct</label>
                      <input type="number" className="form-input" value={sr.correct || ''} min={0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const newSr = [...subjectResults];
                          newSr[idx].correct = val;
                          newSr[idx].attempted = val + newSr[idx].wrong;
                          setSubjectResults(newSr);
                        }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 11 }}>Wrong</label>
                      <input type="number" className="form-input" value={sr.wrong || ''} min={0}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          const newSr = [...subjectResults];
                          newSr[idx].wrong = val;
                          newSr[idx].attempted = newSr[idx].correct + val;
                          setSubjectResults(newSr);
                        }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 11 }}>Unattempted</label>
                      <input type="number" className="form-input" value={sr.unattempted || ''} min={0}
                        onChange={(e) => {
                          const newSr = [...subjectResults];
                          newSr[idx].unattempted = parseInt(e.target.value) || 0;
                          setSubjectResults(newSr);
                        }} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 11 }}>Time (mins)</label>
                      <input type="number" className="form-input" value={sr.timeTaken || ''} min={0}
                        onChange={(e) => {
                          const newSr = [...subjectResults];
                          newSr[idx].timeTaken = parseInt(e.target.value) || 0;
                          setSubjectResults(newSr);
                        }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: 'var(--info-glass)', padding: 12, borderRadius: 8, fontSize: 13 }}>
                Logging topic-level errors enables Phase 4 Mock Intelligence to accurately pinpoint your weaknesses and adjust your study plan automatically.
              </div>
              
              {errors.map((err, idx) => (
                <div key={idx} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', padding: 12, borderRadius: 8, position: 'relative' }}>
                  <button className="btn btn-ghost btn-sm" style={{ position: 'absolute', top: 4, right: 4, color: 'var(--danger)' }} onClick={() => setErrors(errors.filter((_, i) => i !== idx))}><Trash2 size={14} /></button>
                  <div className="grid-3" style={{ gap: 8, marginBottom: 8 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 11 }}>Subject</label>
                      <select className="form-input" value={err.subjectId} onChange={(e) => {
                        const newErrs = [...errors];
                        newErrs[idx].subjectId = e.target.value;
                        newErrs[idx].topicId = '';
                        setErrors(newErrs);
                      }}>
                        {subjectResults.map(s => <option key={s.subjectId} value={s.subjectId}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 11 }}>Topic</label>
                      <select className="form-input" value={err.topicId} onChange={(e) => {
                        const newErrs = [...errors];
                        newErrs[idx].topicId = e.target.value;
                        setErrors(newErrs);
                      }}>
                        <option value="">Select Topic...</option>
                        {topics.filter(t => t.subjectId === parseInt(err.subjectId || subjectResults[0]?.subjectId)).map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 11 }}>Error Type</label>
                      <select className="form-input" value={err.errorType} onChange={(e) => {
                        const newErrs = [...errors];
                        newErrs[idx].errorType = e.target.value;
                        setErrors(newErrs);
                      }}>
                        {ERROR_TYPES.map(et => <option key={et} value={et}>{et}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <input type="text" className="form-input" placeholder="Notes / Q# / What went wrong..." value={err.notes} onChange={(e) => {
                        const newErrs = [...errors];
                        newErrs[idx].notes = e.target.value;
                        setErrors(newErrs);
                      }} />
                  </div>
                </div>
              ))}

              <button className="btn btn-secondary" onClick={handleAddError} style={{ alignSelf: 'flex-start' }}>
                <Plus size={14} /> Add Error Record
              </button>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
          {step > 1 ? (
            <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Back</button>
          ) : <div></div>}
          
          {step < 3 ? (
            <button className="btn btn-primary" onClick={handleNext}>Next Step</button>
          ) : (
            <button className="btn btn-primary" onClick={handleSave}>Save Mock & Errors</button>
          )}
        </div>
      </div>
    </div>
  );
}
