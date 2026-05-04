 const Dialog = ({ user, onAdmit, onClose }) => {
  return (
    <div className="fixed z-50 bottom-24 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto bg-white/90 shadow-xl rounded-xl p-4 border border-blue-100 backdrop-blur max-w-sm">
      <p className="text-slate-800">
        <strong>{user}</strong> wants to join.
      </p>
      <div className="flex gap-2 mt-3">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
          onClick={onAdmit}>
          Admit
        </button>
        <button
          className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200"
          onClick={onClose}>
          Dismiss
        </button>
      </div>
    </div>
  );
};

export default Dialog