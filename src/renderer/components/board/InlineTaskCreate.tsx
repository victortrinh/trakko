import { useState } from 'react';
import { TaskCreateModal } from '../tasks/TaskCreateModal';

export function InlineTaskCreate() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="mt-2 px-3 py-2 text-sm text-text-tertiary hover:text-text-secondary hover:bg-surface-2 rounded-lg transition-colors text-left w-full"
      >
        + Add task
      </button>

      {showModal && <TaskCreateModal onClose={() => setShowModal(false)} />}
    </>
  );
}
