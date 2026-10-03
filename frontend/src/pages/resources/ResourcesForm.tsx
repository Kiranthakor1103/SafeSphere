import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { CustomButton, CustomSelect, Breadcrumb, Loader } from '../../components/ui';

const statusBadge: any = { available: 'green', allocated: 'orange', depleted: 'red', requested: 'blue' };
const TYPES = ['food', 'water', 'medical', 'shelter', 'clothing', 'equipment', 'other'];

interface ResourcesFormProps {
  editing: any;
  form: {
    name: string;
    type: string;
    quantity: number | string;
    unit: string;
    status: string;
    providedBy: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitting?: boolean;
  loading?: boolean;
}

const resourceValidationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .required('Please enter Resource Name')
    .min(2, 'Resource Name must be at least 2 characters')
    .max(100, 'Resource Name must be at most 100 characters'),
  quantity: Yup.number().typeError('Please enter Quantity').min(1, 'Quantity must be at least 1').required('Please enter Quantity'),
});

export const ResourcesForm: React.FC<ResourcesFormProps> = ({
  editing,
  form,
  setForm,
  onSubmit,
  onCancel,
  submitting = false,
  loading = false,
}) => {
  const submitText = editing ? 'Save Changes' : 'Add Resource';

  const formik = useFormik({
    initialValues: {
      name: form.name || '',
      quantity: form.quantity || '',
    },
    enableReinitialize: true,
    validationSchema: resourceValidationSchema,
    onSubmit: () => {
      const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
      onSubmit(syntheticEvent);
    },
  });

  if (loading) {
    return (
      <div className="page">
        <Loader variant="page" text="Loading resource details..." subtext="Retrieving inventory record..." />
      </div>
    );
  }

  return (
    <div className="page" style={{ position: 'relative' }}>
      {submitting && (
        <Loader
          variant="overlay"
          text={editing ? "Updating resource..." : "Adding resource..."}
          subtext="Saving changes to inventory..."
        />
      )}
      <Breadcrumb
        items={[
          { label: 'Resources Inventory', onClick: onCancel },
          { label: editing ? `Edit Resource` : 'Add New Resource' }
        ]}
      />

      <form onSubmit={formik.handleSubmit} noValidate>
        <div className="page-header">
          <div>
            <h1 className="page-title">{editing ? 'Edit Resource Entry' : 'Add Resource Entry'}</h1>
            <div className="page-subtitle">
              {editing ? 'Update inventory counts and supply details' : 'Log new relief supplies and emergency equipment into inventory'}
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
              Resource Name <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
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
              placeholder="e.g. Blankets, Rice Bags, Water Bottles"
            />
            {formik.touched.name && formik.errors.name && (
              <div className="form-error-msg">{formik.errors.name}</div>
            )}
          </div>

          <div className="form-grid-2">
            <CustomSelect
              label="Type"
              options={TYPES}
              value={form.type}
              onChange={val => setForm((p: any) => ({ ...p, type: val }))}
            />
            <CustomSelect
              label="Status"
              options={Object.keys(statusBadge)}
              value={form.status}
              onChange={val => setForm((p: any) => ({ ...p, status: val }))}
            />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">
                Quantity <span className="required-star" style={{ color: '#ef4444', fontWeight: 'bold', marginLeft: '2px' }}>*</span>
              </label>
              <input
                name="quantity"
                className={`form-input ${formik.touched.quantity && formik.errors.quantity ? 'is-invalid' : ''}`}
                type="number"
                value={form.quantity}
                onChange={e => {
                  formik.handleChange(e);
                  setForm((p: any) => ({ ...p, quantity: Number(e.target.value) }));
                }}
                onBlur={formik.handleBlur}
                placeholder="0"
              />
              {formik.touched.quantity && formik.errors.quantity && (
                <div className="form-error-msg">{formik.errors.quantity}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Unit of Measure</label>
              <input
                className="form-input"
                value={form.unit}
                onChange={e => setForm((p: any) => ({ ...p, unit: e.target.value }))}
                placeholder="e.g. kg, liters, boxes"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Provided By / Organization</label>
            <input
              className="form-input"
              value={form.providedBy}
              onChange={e => setForm((p: any) => ({ ...p, providedBy: e.target.value }))}
              placeholder="e.g. Red Cross, Local NGO"
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default ResourcesForm;
