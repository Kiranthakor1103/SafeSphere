import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Bell } from 'lucide-react';
import { CustomButton, CustomSelect, Breadcrumb, Loader } from '../../components/ui';
import { getCountries, getStatesForCountry, getDistrictsForState } from '../../utils/locationData';

const TYPES = ['warning', 'danger', 'info', 'success', 'evacuation'];

interface AlertsFormProps {
  editing: any;
  form: {
    title: string;
    message: string;
    type: string;
    targetCountry?: string;
    targetState?: string;
    targetDistrict?: string;
    sendSMS?: boolean;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting?: boolean;
  loading?: boolean;
}

const alertValidationSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .required('Please enter Alert Title')
    .min(2, 'Alert Title must be at least 2 characters')
    .max(100, 'Alert Title must be at most 100 characters'),
  message: Yup.string()
    .trim()
    .required('Please enter Alert Message')
    .max(500, 'Message must be at most 500 characters'),
});

export const AlertsForm: React.FC<AlertsFormProps> = ({
  editing,
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting = false,
  loading = false,
}) => {
  const currentCountry = form.targetCountry || 'Select Country';
  const availableStates = getStatesForCountry(currentCountry, 'Select State');
  const currentState = availableStates.includes(form.targetState || '') ? (form.targetState || 'Select State') : 'Select State';
  const availableDistricts = getDistrictsForState(currentCountry, currentState, 'Select District / Region');
  const currentDistrict = availableDistricts.includes(form.targetDistrict || '') ? (form.targetDistrict || 'Select District / Region') : 'Select District / Region';

  const handleCountryChange = (targetCountry: string) => {
    setForm((p: any) => ({
      ...p,
      targetCountry,
      targetState: 'Select State',
      targetDistrict: 'Select District / Region'
    }));
  };

  const handleStateChange = (targetState: string) => {
    setForm((p: any) => ({
      ...p,
      targetState,
      targetDistrict: 'Select District / Region'
    }));
  };

  const handleDistrictChange = (targetDistrict: string) => {
    setForm((p: any) => ({
      ...p,
      targetDistrict
    }));
  };

  const submitText = editing ? 'Update Alert' : 'Broadcast Now';

  const formik = useFormik({
    initialValues: {
      title: form.title || '',
      message: form.message || '',
    },
    enableReinitialize: true,
    validationSchema: alertValidationSchema,
    onSubmit: () => {
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      onSubmit(syntheticEvent);
    },
  });

  if (loading) {
    return (
      <div className="page">
        <Loader variant="page" text="Loading alert form..." subtext="Retrieving alert details..." />
      </div>
    );
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      {submitting && (
        <Loader
          variant="overlay"
          text={editing ? "Updating alert..." : "Broadcasting alert..."}
          subtext="Sending notification across network..."
        />
      )}
      <Breadcrumb
        items={[
          { label: 'System Alerts', onClick: onCancel },
          { label: editing ? `Edit Alert` : 'Add New Alert' }
        ]}
      />

      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="page-header">
          <div>
            <h1 className="page-title">{editing ? 'Edit Broadcast Alert' : 'Broadcast System Alert'}</h1>
            <div className="page-subtitle">
              {editing ? 'Modify emergency announcement details' : 'Dispatch critical emergency notifications and public warnings'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <CustomButton type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" variant="primary" icon={<Bell size={16} />} loading={submitting}>
              {submitText}
            </CustomButton>
          </div>
        </div>

        <div className="card form-card">
          <div className="form-group">
            <label className="form-label">
              Alert Title <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
            </label>
            <input
              name="title"
              className={`form-input ${formik.touched.title && formik.errors.title ? 'is-invalid' : ''}`}
              value={form.title}
              onChange={e => {
                formik.handleChange(e);
                setForm((p: any) => ({ ...p, title: e.target.value }));
              }}
              onBlur={formik.handleBlur}
              placeholder="e.g. Mandatory Evacuation Order - Coastal Zone 4"
            />
            {formik.touched.title && formik.errors.title && (
              <div className="form-error-msg">{formik.errors.title}</div>
            )}
          </div>

          <div className="form-grid-2">
            <CustomSelect
              label="Alert Type & Priority"
              options={TYPES}
              value={form.type}
              onChange={val => setForm((p: any) => ({ ...p, type: val }))}
            />

            <CustomSelect
              label="Target Country"
              options={['All Countries', ...getCountries()]}
              value={currentCountry}
              onChange={handleCountryChange}
            />
          </div>

          <div className="form-grid-2">
            <CustomSelect
              label="Target State"
              options={availableStates}
              value={currentState}
              onChange={handleStateChange}
            />

            <CustomSelect
              label="Target District / Region"
              options={availableDistricts}
              value={currentDistrict}
              onChange={handleDistrictChange}
            />
          </div>

          <div 
            style={{ 
              background: 'rgba(66, 109, 196, 0.06)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '14px 16px', 
              marginBottom: 20, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                📱 Instant Regional Mobile SMS Alert
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
                Automatically send emergency SMS broadcasts to all registered citizens residing in {form.targetDistrict || 'All Regions'}.
              </div>
            </div>

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: '13px', color: 'var(--accent-blue)' }}>
              <input
                type="checkbox"
                checked={!!form.sendSMS}
                onChange={e => setForm((p: any) => ({ ...p, sendSMS: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              />
              Send Mobile SMS
            </label>
          </div>

          <div className="form-group">
            <label className="form-label">
              Message Content <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
            </label>
            <textarea
              name="message"
              className={`form-input ${formik.touched.message && formik.errors.message ? 'is-invalid' : ''}`}
              rows={5}
              value={form.message}
              onChange={e => {
                formik.handleChange(e);
                setForm((p: any) => ({ ...p, message: e.target.value }));
              }}
              onBlur={formik.handleBlur}
              placeholder="Detailed message instructions, safety protocols, evacuation routes..."
              style={{ resize: 'vertical' }}
            />
            {formik.touched.message && formik.errors.message && (
              <div className="form-error-msg">{formik.errors.message}</div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default AlertsForm;
