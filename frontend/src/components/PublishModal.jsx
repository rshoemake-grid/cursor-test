import PropTypes from "prop-types";
import { X } from "lucide-react";
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_DIFFICULTIES,
  formatCategory,
  formatDifficulty,
} from "../config/templateConstants";
import {
  PublishModalOverlay,
  PublishModalForm,
  PublishModalHeader,
  PublishModalTitle,
  PublishModalCloseIcon,
  PublishModalField,
  PublishModalLabel,
  PublishModalInput,
  PublishModalTextarea,
  PublishModalSelect,
  PublishModalRow,
  PublishModalRowCol,
  PublishModalActions,
  PublishModalCancelBtn,
  PublishModalSubmitBtn,
} from "../styles/publishModal.styled";

function PublishModal({ dialog, form, handlers }) {
  const { isOpen, isPublishing } = dialog;
  const { onClose, onFormChange, onSubmit } = handlers;
  if (!isOpen) return null;
  return (
    <PublishModalOverlay>
      <PublishModalForm
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(e);
        }}
      >
        <PublishModalHeader>
          <PublishModalTitle>Publish to Marketplace</PublishModalTitle>
          <PublishModalCloseIcon onClick={onClose} aria-label="Close">
            <X aria-hidden />
          </PublishModalCloseIcon>
        </PublishModalHeader>
        <PublishModalField>
          <PublishModalLabel>Workflow Name</PublishModalLabel>
          <PublishModalInput
            type="text"
            value={form.name}
            onChange={(e) => onFormChange("name", e.target.value)}
            required={true}
          />
        </PublishModalField>
        <PublishModalField>
          <PublishModalLabel>Description (optional)</PublishModalLabel>
          <PublishModalTextarea
            value={form.description}
            onChange={(e) => onFormChange("description", e.target.value)}
            rows={3}
          />
        </PublishModalField>
        <PublishModalField>
          <PublishModalLabel>Category</PublishModalLabel>
          <PublishModalSelect
            value={form.category}
            onChange={(e) => onFormChange("category", e.target.value)}
          >
            {TEMPLATE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {formatCategory(category)}
              </option>
            ))}
          </PublishModalSelect>
        </PublishModalField>
        <PublishModalRow>
          <PublishModalRowCol>
            <PublishModalLabel>Difficulty</PublishModalLabel>
            <PublishModalSelect
              value={form.difficulty}
              onChange={(e) => onFormChange("difficulty", e.target.value)}
            >
              {TEMPLATE_DIFFICULTIES.map((diff) => (
                <option key={diff} value={diff}>
                  {formatDifficulty(diff)}
                </option>
              ))}
            </PublishModalSelect>
          </PublishModalRowCol>
          <PublishModalRowCol>
            <PublishModalLabel>Estimated Time</PublishModalLabel>
            <PublishModalInput
              type="text"
              value={form.estimated_time}
              onChange={(e) => onFormChange("estimated_time", e.target.value)}
              placeholder="e.g. 30 minutes"
            />
          </PublishModalRowCol>
        </PublishModalRow>
        <PublishModalField>
          <PublishModalLabel>Tags (comma separated)</PublishModalLabel>
          <PublishModalInput
            type="text"
            value={form.tags}
            onChange={(e) => onFormChange("tags", e.target.value)}
            placeholder="automation, ai, ... "
          />
        </PublishModalField>
        <PublishModalActions>
          <PublishModalCancelBtn onClick={onClose}>Cancel</PublishModalCancelBtn>
          <PublishModalSubmitBtn disabled={isPublishing}>
            {isPublishing ? "Publishing..." : "Publish"}
          </PublishModalSubmitBtn>
        </PublishModalActions>
      </PublishModalForm>
    </PublishModalOverlay>
  );
}

PublishModal.propTypes = {
  dialog: PropTypes.shape({
    isOpen: PropTypes.bool.isRequired,
    isPublishing: PropTypes.bool.isRequired,
  }).isRequired,
  form: PropTypes.object.isRequired,
  handlers: PropTypes.shape({
    onClose: PropTypes.func.isRequired,
    onFormChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
  }).isRequired,
};

export { PublishModal };
