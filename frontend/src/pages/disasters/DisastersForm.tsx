import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import LocationPicker from '../../components/LocationPicker';
import { CustomButton, CustomSelect, Breadcrumb, Loader } from '../../components/ui';

const statusBadge: any = { active: 'red', monitoring: 'orange', resolved: 'green', closed: 'gray' };
const severityBadge: any = { low: 'green', medium: 'yellow', high: 'orange', critical: 'red' };
const TYPES = ['flood', 'earthquake', 'cyclone', 'fire', 'landslide', 'tsunami', 'other'];

interface DisastersFormProps {
  editing: any;
  form: {
    title: string;
    type: string;
    severity: string;
    status: string;
    description: string;
    location: { lat: string | number; lng: string | number; address: string };
    affectedCount: number | string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting?: boolean;
  loading?: boolean;
}

const disasterValidationSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .required('Please enter Title')
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be at most 100 characters'),
  locationAddress: Yup.string().trim().required('Please enter Location Address'),
  description: Yup.string()
    .trim()
    .max(500, 'Description must be at most 500 characters'),
});

export const DisastersForm: React.FC<DisastersFormProps> = ({
  editing,
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting = false,
  loading = false,
}) => {
  const submitText = editing ? 'Update Disaster' : 'Report Incident';

  const formik = useFormik({
    initialValues: {
      title: form.title || '',
      locationAddress: form.location?.address || '',
      description: form.description || '',
    },
    enableReinitialize: true,
    validationSchema: disasterValidationSchema,
    onSubmit: () => {
      // Trigger parent handler
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      onSubmit(syntheticEvent);
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e);
    setForm((p: any) => ({ ...p, title: e.target.value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formik.handleChange(e);
    setForm((p: any) => ({ ...p, location: { ...p.location, address: e.target.value } }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    formik.handleChange(e);
    setForm((p: any) => ({ ...p, description: e.target.value }));
  };

  if (loading) {
    return (
      <div className="page">
        <Loader variant="page" text="Loading disaster form..." subtext="Retrieving disaster details..." />
      </div>
    );
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      {submitting && (
        <Loader
          variant="overlay"
          text={editing ? "Updating disaster..." : "Reporting disaster..."}
          subtext="Saving changes to emergency system..."
        />
      )}
      <Breadcrumb
        items={[
          { label: 'Disasters', onClick: onCancel },
          { label: editing ? `Edit Disaster` : 'Add New Disaster' }
        ]}
      />

      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="page-header">
          <div>
            <h1 className="page-title">{editing ? 'Edit Disaster Incident' : 'Report New Incident'}</h1>
            <div className="page-subtitle">
              {editing ? 'Update disaster status, severity, and affected zones' : 'Log a new emergency incident for rapid emergency response'}
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
          <div className="form-group">
            <label className="form-label">
              Title <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
            </label>
            <input
              name="title"
              className={`form-input ${formik.touched.title && formik.errors.title ? 'is-invalid' : ''}`}
              value={form.title}
              onChange={handleTitleChange}
              onBlur={formik.handleBlur}
              placeholder="e.g. Flood Alert - Sector 4"
            />
            {formik.touched.title && formik.errors.title && (
              <div className="form-error-msg">{formik.errors.title}</div>
            )}
          </div>

          <div className="form-grid-2">
            <CustomSelect label="Incident Type" options={TYPES} value={form.type} onChange={val => setForm((p: any) => ({ ...p, type: val }))} />
            <CustomSelect label="Severity" options={Object.keys(severityBadge)} value={form.severity} onChange={val => setForm((p: any) => ({ ...p, severity: val }))} />
          </div>

          <div className="form-grid-2">
            <CustomSelect label="Status" options={Object.keys(statusBadge)} value={form.status} onChange={val => setForm((p: any) => ({ ...p, status: val }))} />
            <div className="form-group">
              <label className="form-label">Est. Affected People</label>
              <input className="form-input" type="number" value={form.affectedCount} onChange={e => setForm((p: any) => ({ ...p, affectedCount: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Location Address <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
            </label>
            <input
              name="locationAddress"
              className={`form-input ${formik.touched.locationAddress && formik.errors.locationAddress ? 'is-invalid' : ''}`}
              value={form.location.address}
              onChange={handleAddressChange}
              onBlur={formik.handleBlur}
              placeholder="Location address"
            />
            {formik.touched.locationAddress && formik.errors.locationAddress && (
              <div className="form-error-msg">{formik.errors.locationAddress}</div>
            )}
          </div>

          <LocationPicker
            value={form.location}
            onChange={location => {
              setForm((p: any) => ({ ...p, location: { ...p.location, ...location } }));
              formik.setFieldValue('locationAddress', location.address || '');
            }}
            label="Incident location *"
          />

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input" value={form.location.lat} readOnly aria-label="Selected latitude" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input" value={form.location.lng} readOnly aria-label="Selected longitude" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className={`form-input ${formik.touched.description && formik.errors.description ? 'is-invalid' : ''}`}
              rows={4}
              value={form.description}
              onChange={handleDescriptionChange}
              onBlur={formik.handleBlur}
              style={{ resize: 'vertical' }}
              placeholder="Provide detailed operational instructions or casualty reports..."
            />
            {formik.touched.description && formik.errors.description && (
              <div className="form-error-msg">{formik.errors.description}</div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default DisastersForm;
