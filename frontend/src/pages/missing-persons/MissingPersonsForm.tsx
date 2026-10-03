import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import LocationPicker from '../../components/LocationPicker';
import { CustomButton, CustomSelect, Breadcrumb, PhoneWithCountryInput, validatePhone, Loader } from '../../components/ui';

interface MissingPersonsFormProps {
  editing: any;
  form: {
    name: string;
    age: string | number;
    gender: string;
    status: string;
    lastSeenLocation: { lat: string | number; lng: string | number; address: string };
    lastSeenDate: string;
    contactPerson: string;
    contactPhone: string;
    countryCode?: string;
    distinguishingFeatures: string;
    description: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting?: boolean;
  loading?: boolean;
}

export const MissingPersonsForm: React.FC<MissingPersonsFormProps> = ({
  editing,
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting = false,
  loading = false,
}) => {
  const submitText = editing ? 'Update Report' : 'Submit Report';

  const missingPersonValidationSchema = Yup.object().shape({
    name: Yup.string()
      .trim()
      .required('Please enter Full Name')
      .min(2, 'Full Name must be at least 2 characters')
      .max(100, 'Full Name must be at most 100 characters'),
    lastSeenAddress: Yup.string().trim().required('Please enter Last Seen Address'),
    distinguishingFeatures: Yup.string()
      .trim()
      .max(500, 'Description must be at most 500 characters'),
    contactPhone: Yup.string()
      .trim()
      .test('phone-validation', function (val) {
        if (!val) return true;
        const err = validatePhone(form.countryCode || '+91', val, false);
        if (err) return this.createError({ message: err });
        return true;
      }),
  });

  const formik = useFormik({
    initialValues: {
      name: form.name || '',
      lastSeenAddress: form.lastSeenLocation?.address || '',
      distinguishingFeatures: form.distinguishingFeatures || '',
    },
    enableReinitialize: true,
    validationSchema: missingPersonValidationSchema,
    onSubmit: () => {
      if (form.contactPhone) {
        const phoneErr = validatePhone(form.countryCode || '+91', form.contactPhone, false);
        if (phoneErr) {
          toast.error(phoneErr);
          return;
        }
      }
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      onSubmit(syntheticEvent);
    },
  });

  const handleFeaturesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    formik.handleChange(e);
    setForm((p: any) => ({ ...p, distinguishingFeatures: e.target.value }));
  };

  if (loading) {
    return (
      <div className="page">
        <Loader variant="page" text="Loading missing person record..." subtext="Retrieving details..." />
      </div>
    );
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      {submitting && (
        <Loader
          variant="overlay"
          text={editing ? "Updating report..." : "Submitting missing person report..."}
          subtext="Saving report details to search registry..."
        />
      )}
      <Breadcrumb
        items={[
          { label: 'Missing Persons', onClick: onCancel },
          { label: editing ? `Edit Missing Person` : 'Add New Missing Person' }
        ]}
      />

      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="page-header">
          <div>
            <h1 className="page-title">{editing ? 'Edit Missing Person Report' : 'File Missing Person Report'}</h1>
            <div className="page-subtitle">
              {editing ? 'Update details regarding the missing person' : 'Report an individual missing during emergency incidents'}
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
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Full Name <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
              </label>
              <input
                name="name"
                className={`form-input ${formik.touched.name && formik.errors.name ? 'is-invalid' : ''}`}
                value={form.name}
                onChange={e => {
                  formik.handleChange(e);
                  setForm((p: any) => ({ ...p, name: e.target.value }));
                }}
                onBlur={formik.handleBlur}
                placeholder="Full Name"
              />
              {formik.touched.name && formik.errors.name && (
                <div className="form-error-msg">{formik.errors.name}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input className="form-input" type="number" value={form.age} onChange={e => setForm((p: any) => ({ ...p, age: e.target.value }))} placeholder="e.g. 28" />
            </div>
          </div>

          <div className="form-grid-2">
            <CustomSelect label="Gender" options={['male', 'female', 'other', 'unknown']} value={form.gender} onChange={val => setForm((p: any) => ({ ...p, gender: val }))} />
            <CustomSelect label="Status" options={['missing', 'found', 'deceased']} value={form.status} onChange={val => setForm((p: any) => ({ ...p, status: val }))} />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Contact Person</label>
              <input className="form-input" value={form.contactPerson} onChange={e => setForm((p: any) => ({ ...p, contactPerson: e.target.value }))} placeholder="Guardian / Reporter name" />
            </div>
            <PhoneWithCountryInput
              label="Contact Phone"
              countryCode={form.countryCode}
              contactPhone={form.contactPhone}
              onCountryCodeChange={code => setForm((p: any) => ({ ...p, countryCode: code }))}
              onContactPhoneChange={phone => setForm((p: any) => ({ ...p, contactPhone: phone }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Last Seen Address <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
            </label>
            <input
              name="lastSeenAddress"
              className={`form-input ${formik.touched.lastSeenAddress && formik.errors.lastSeenAddress ? 'is-invalid' : ''}`}
              value={form.lastSeenLocation.address}
              onChange={e => {
                formik.handleChange(e);
                setForm((p: any) => ({ ...p, lastSeenLocation: { ...p.lastSeenLocation, address: e.target.value } }));
              }}
              onBlur={formik.handleBlur}
              placeholder="Location address"
            />
            {formik.touched.lastSeenAddress && formik.errors.lastSeenAddress && (
              <div className="form-error-msg">{formik.errors.lastSeenAddress}</div>
            )}
          </div>

          <LocationPicker
            value={form.lastSeenLocation}
            onChange={location => {
              setForm((p: any) => ({ ...p, lastSeenLocation: { ...p.lastSeenLocation, ...location } }));
              formik.setFieldValue('lastSeenAddress', location.address || '');
            }}
            label="Last seen location *"
          />

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input" value={form.lastSeenLocation.lat} readOnly aria-label="Selected latitude" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input" value={form.lastSeenLocation.lng} readOnly aria-label="Selected longitude" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Distinguishing Features / Description</label>
            <textarea
              name="distinguishingFeatures"
              className={`form-input ${formik.touched.distinguishingFeatures && formik.errors.distinguishingFeatures ? 'is-invalid' : ''}`}
              rows={4}
              value={form.distinguishingFeatures}
              onChange={handleFeaturesChange}
              onBlur={formik.handleBlur}
              style={{ resize: 'vertical' }}
              placeholder="Height, clothing, birthmarks, tattoos, or special identification details..."
            />
            {formik.touched.distinguishingFeatures && formik.errors.distinguishingFeatures && (
              <div className="form-error-msg">{formik.errors.distinguishingFeatures}</div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default MissingPersonsForm;
