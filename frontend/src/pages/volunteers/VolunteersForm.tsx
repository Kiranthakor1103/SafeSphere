import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { CustomButton, CustomSelect, Breadcrumb, Loader } from '../../components/ui';

const SKILLS = ['medical', 'first_aid', 'search_rescue', 'driving', 'cooking', 'logistics', 'counseling', 'translation', 'technical'];

interface VolunteersFormProps {
  editing: any;
  form: {
    skills: string[];
    isAvailable?: boolean;
    experience: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  toggleSkill: (skill: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting?: boolean;
  loading?: boolean;
}

const volunteerValidationSchema = Yup.object().shape({
  experience: Yup.string()
    .trim()
    .required('Please enter Experience / Background details')
    .max(500, 'Experience / Notes must be at most 500 characters'),
});

export const VolunteersForm: React.FC<VolunteersFormProps> = ({
  editing,
  form,
  setForm,
  toggleSkill,
  onSubmit,
  onCancel,
  submitting = false,
  loading = false,
}) => {
  const submitText = editing ? 'Save Changes' : 'Register Volunteer';

  const formik = useFormik({
    initialValues: {
      experience: form.experience || '',
    },
    enableReinitialize: true,
    validationSchema: volunteerValidationSchema,
    onSubmit: () => {
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      onSubmit(syntheticEvent);
    },
  });

  if (loading) {
    return (
      <div className="page">
        <Loader variant="page" text="Loading volunteer details..." subtext="Retrieving profile records..." />
      </div>
    );
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      {submitting && (
        <Loader
          variant="overlay"
          text={editing ? "Updating volunteer..." : "Registering volunteer..."}
          subtext="Saving volunteer profile..."
        />
      )}
      <Breadcrumb
        items={[
          { label: 'Volunteers', onClick: onCancel },
          { label: editing ? `Edit Volunteer` : 'Add New Volunteer' }
        ]}
      />

      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="page-header">
          <div>
            <h1 className="page-title">{editing ? 'Edit Volunteer Details' : 'Register as Volunteer'}</h1>
            <div className="page-subtitle">
              {editing ? 'Update volunteer availability and technical skill sets' : 'Join disaster response teams to assist in active relief operations'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <CustomButton type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" loading={submitting}>
              {submitText}
            </CustomButton>
          </div>
        </div>

        <div className="card form-card">
          <CustomSelect
            label="Current Availability (Willing to Work?)"
            options={['Yes', 'No']}
            value={form.isAvailable !== false ? 'Yes' : 'No'}
            onChange={val => setForm((p: any) => ({ ...p, isAvailable: val === 'Yes' }))}
          />

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 12 }}>Skills & Qualifications</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {SKILLS.map(skill => (
                <label key={skill} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.skills.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                  />
                  {skill.replace('_', ' ')}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Relevant Experience / Notes <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
            </label>
            <textarea
              name="experience"
              className={`form-input ${formik.touched.experience && formik.errors.experience ? 'is-invalid' : ''}`}
              rows={4}
              value={form.experience}
              onChange={e => {
                formik.handleChange(e);
                setForm((p: any) => ({ ...p, experience: e.target.value }));
              }}
              onBlur={formik.handleBlur}
              placeholder="Detail prior disaster response experience, certifications, or licenses..."
              style={{ resize: 'vertical' }}
            />
            {formik.touched.experience && formik.errors.experience && (
              <div className="form-error-msg">{formik.errors.experience}</div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default VolunteersForm;
