document.addEventListener('DOMContentLoaded', function() {
    // Constants
    const PASSWORD = "0000";
    
    // DOM Elements
    const medicineCards = document.querySelectorAll('.medicine-card');
    const logTableBody = document.getElementById('log-table-body');
    const medicineFilter = document.getElementById('medicine-filter');
    const viewToggleBtn = document.getElementById('view-toggle');
    const noLogsMessage = document.getElementById('no-logs');
    const successMessage = document.getElementById('success-message');
    
    // Record Modal Elements
    const recordModal = document.getElementById('record-modal');
    const closeRecordModalBtn = document.getElementById('close-record-modal');
    const cancelRecordBtn = document.getElementById('cancel-record');
    const confirmRecordBtn = document.getElementById('confirm-record');
    const recordPasswordInput = document.getElementById('record-password-input');
    const recordPasswordError = document.getElementById('record-password-error');
    
    // Edit Modal Elements
    const editModal = document.getElementById('edit-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    const cancelEditBtn = document.getElementById('cancel-edit');
    const saveEditBtn = document.getElementById('save-edit');
    const passwordInput = document.getElementById('password-input');
    const datetimeInput = document.getElementById('datetime-input');
    const passwordError = document.getElementById('password-error');
    
    // Delete Modal Elements
    const deleteModal = document.getElementById('delete-modal');
    const closeDeleteModalBtn = document.getElementById('close-delete-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const deletePasswordInput = document.getElementById('delete-password-input');
    const deletePasswordError = document.getElementById('delete-password-error');
    
    // State
    let medicationLogs = [];
    let currentEditingLog = null;
    let currentDeletingLog = null;
    let pendingMedicine = null;
    let showingAllLogs = false;
    
    // Initialize
    loadDataFromStorage();
    setupEventListeners();
    populateMedicineFilter();
    
    // Setup Event Listeners
    function setupEventListeners() {
        // Medicine cards click - now shows password modal
        medicineCards.forEach(card => {
            card.addEventListener('click', function() {
                const medicineName = this.getAttribute('data-name');
                showRecordModal(medicineName);
            });
        });
        
        // View toggle button
        viewToggleBtn.addEventListener('click', toggleLogView);
        
        // Medicine filter change
        medicineFilter.addEventListener('change', updateLogTable);
        
        // Record Modal Events
        closeRecordModalBtn.addEventListener('click', closeRecordModal);
        cancelRecordBtn.addEventListener('click', closeRecordModal);
        confirmRecordBtn.addEventListener('click', verifyAndRecordMedication);
        recordPasswordInput.addEventListener('input', function() {
            recordPasswordError.style.display = 'none';
        });
        
        // Edit Modal Events
        closeEditModalBtn.addEventListener('click', closeEditModal);
        cancelEditBtn.addEventListener('click', closeEditModal);
        saveEditBtn.addEventListener('click', saveEditedTime);
        passwordInput.addEventListener('input', function() {
            passwordError.style.display = 'none';
        });
        
        // Delete Modal Events
        closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
        confirmDeleteBtn.addEventListener('click', confirmDeleteRecord);
        deletePasswordInput.addEventListener('input', function() {
            deletePasswordError.style.display = 'none';
        });
    }
    
    // Load data from localStorage
    function loadDataFromStorage() {
        const savedLogs = localStorage.getItem('medicationLogs');
        if (savedLogs) {
            medicationLogs = JSON.parse(savedLogs);
            updateLogTable();
            updateLastTakenTimes();
        }
    }
    
    // Save data to localStorage
    function saveDataToStorage() {
        localStorage.setItem('medicationLogs', JSON.stringify(medicationLogs));
    }
    
    // Show Record Modal
    function showRecordModal(medicineName) {
        pendingMedicine = medicineName;
        recordPasswordInput.value = '';
        recordPasswordError.style.display = 'none';
        recordModal.style.display = 'block';
    }
    
    // Close Record Modal
    function closeRecordModal() {
        recordModal.style.display = 'none';
        pendingMedicine = null;
    }
    
    // Verify Password and Record Medication
    function verifyAndRecordMedication()
