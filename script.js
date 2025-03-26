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
    const medicineInfo = document.getElementById('medicine-info');
    const closeRecordModalBtn = document.getElementById('close-record-modal');
    const cancelRecordBtn = document.getElementById('cancel-record');
    const confirmRecordBtn = document.getElementById('confirm-record');
    const recordDatetimeInput = document.getElementById('record-datetime-input');
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
        // Medicine cards click - now shows password modal with date/time prefilled
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
    
    // Get current date and time formatted for datetime-local input
    function getCurrentDateTimeForInput() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    // Show Record Modal
    function showRecordModal(medicineName) {
        pendingMedicine = medicineName;
        medicineInfo.textContent = `Recording: ${medicineName}`;
        
        // Set current date and time
        recordDatetimeInput.value = getCurrentDateTimeForInput();
        
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
    function verifyAndRecordMedication() {
        if (recordPasswordInput.value !== PASSWORD) {
            recordPasswordError.style.display = 'block';
            return;
        }
        
        if (pendingMedicine && recordDatetimeInput.value) {
            const selectedDateTime = new Date(recordDatetimeInput.value);
            recordMedication(pendingMedicine, selectedDateTime);
            closeRecordModal();
        }
    }
    
    // Record medication with specified date/time
    function recordMedication(medicineName, dateTime) {
        const logEntry = {
            id: Date.now(),
            medicine: medicineName,
            dateTime: dateTime.toISOString(),
            isEdited: false
        };
        
        medicationLogs.push(logEntry);
        saveDataToStorage();
        updateLogTable();
        updateLastTakenTimes();
        showSuccessMessage(`${medicineName} taken successfully!`);
    }
    
    // Update last taken times on medicine cards
    function updateLastTakenTimes() {
        const medicineMap = new Map();
        
        // Find the latest log for each medicine
        for (const log of medicationLogs) {
            const existing = medicineMap.get(log.medicine);
            if (!existing || new Date(log.dateTime) > new Date(existing.dateTime)) {
                medicineMap.set(log.medicine, log);
            }
        }
        
        // Update the last taken text for each medicine card
        medicineMap.forEach((log, medicine) => {
            const element = document.getElementById(`last-taken-${medicine}`);
            if (element) {
                const date = new Date(log.dateTime);
                element.textContent = `Last taken: ${formatDate(date)}`;
            }
        });
    }
    
    // Format date for display
    function formatDate(date) {
        return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }
    
    // Update log table based on filters
    function updateLogTable() {
        // Clear current table
        logTableBody.innerHTML = '';
        
        // Apply medicine filter
        const selectedMedicine = medicineFilter.value;
        let filteredLogs = selectedMedicine === 'all' 
            ? medicationLogs 
            : medicationLogs.filter(log => log.medicine === selectedMedicine);
        
        // If not showing all logs, only show the latest for each medicine
        if (!showingAllLogs) {
            const latestLogsMap = new Map();
            for (const log of filteredLogs) {
                const existing = latestLogsMap.get(log.medicine);
                if (!existing || new Date(log.dateTime) > new Date(existing.dateTime)) {
                    latestLogsMap.set(log.medicine, log);
                }
            }
            filteredLogs = Array.from(latestLogsMap.values());
        }
        
        // Sort logs (newest first)
        filteredLogs.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        
        // Display logs or message
        if (filteredLogs.length === 0) {
            noLogsMessage.style.display = 'block';
        } else {
            noLogsMessage.style.display = 'none';
            
            // Add log entries to table
            filteredLogs.forEach(log => {
                const date = new Date(log.dateTime);
                const row = document.createElement('tr');
                
                row.innerHTML = `
                    <td>${log.medicine}</td>
                    <td>${date.toLocaleDateString()}</td>
                    <td>
                        ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        ${log.isEdited ? '<span class="time-badge">edited</span>' : ''}
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="edit-button">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="delete-button">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </td>
                `;
                
                // Add edit button event listener
                const editButton = row.querySelector('.edit-button');
                editButton.addEventListener('click', () => openEditModal(log.id));
                
                // Add delete button event listener
                const deleteButton = row.querySelector('.delete-button');
                deleteButton.addEventListener('click', () => openDeleteModal(log.id));
                
                logTableBody.appendChild(row);
            });
        }
    }
    
    // Toggle between showing all logs and only the latest
    function toggleLogView() {
        showingAllLogs = !showingAllLogs;
        viewToggleBtn.innerHTML = showingAllLogs 
            ? '<i class="fas fa-filter"></i> Show Latest Only'
            : '<i class="fas fa-list"></i> View All Logs';
        updateLogTable();
    }
    
    // Populate medicine filter dropdown
    function populateMedicineFilter() {
        // Clear existing options except "All Medications"
        while (medicineFilter.options.length > 1) {
            medicineFilter.remove(1);
        }
        
        // Get unique medicine names from logs
        const medicineSet = new Set();
        medicationLogs.forEach(log => medicineSet.add(log.medicine));
        
        // Add all medicines from cards
        medicineCards.forEach(card => {
            const medicineName = card.getAttribute('data-name');
            medicineSet.add(medicineName);
        });
        
        // Create and append options
        medicineSet.forEach(medicine => {
            if (medicine) {
                const option = document.createElement('option');
                option.value = medicine;
                option.textContent = medicine;
                medicineFilter.appendChild(option);
            }
        });
    }
    
    // Open edit modal
    function openEditModal(logId) {
        currentEditingLog = medicationLogs.find(log => log.id === logId);
        if (currentEditingLog) {
            const dateTime = new Date(currentEditingLog.dateTime);
            
            // Format datetime for the input (YYYY-MM-DDThh:mm)
            const year = dateTime.getFullYear();
            const month = String(dateTime.getMonth() + 1).padStart(2, '0');
            const day = String(dateTime.getDate()).padStart(2, '0');
            const hours = String(dateTime.getHours()).padStart(2, '0');
            const minutes = String(dateTime.getMinutes()).padStart(2, '0');
            
            const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
            
            datetimeInput.value = formattedDateTime;
            passwordInput.value = '';
            passwordError.style.display = 'none';
            editModal.style.display = 'block';
        }
    }
    
    // Close edit modal
    function closeEditModal() {
        editModal.style.display = 'none';
        currentEditingLog = null;
    }
    
    // Save edited time
    function saveEditedTime() {
        if (passwordInput.value !== PASSWORD) {
            passwordError.style.display = 'block';
            return;
        }
        
        if (datetimeInput.value && currentEditingLog) {
            // Update the log
            const newDateTime = new Date(datetimeInput.value);
            
            // Find and update the log in the array
            medicationLogs = medicationLogs.map(log => {
                if (log.id === currentEditingLog.id) {
                    return {
                        ...log,
                        dateTime: newDateTime.toISOString(),
                        isEdited: true
                    };
                }
                return log;
            });
            
            // Save data and update UI
            saveDataToStorage();
            updateLogTable();
            updateLastTakenTimes();
            showSuccessMessage(`Time for ${currentEditingLog.medicine} updated successfully!`);
            closeEditModal();
        }
    }
    
    // Open delete modal
    function openDeleteModal(logId) {
        currentDeletingLog = medicationLogs.find(log => log.id === logId);
        if (currentDeletingLog) {
            deletePasswordInput.value = '';
            deletePasswordError.style.display = 'none';
            deleteModal.style.display = 'block';
        }
    }
    
    // Close delete modal
    function closeDeleteModal() {
        deleteModal.style.display = 'none';
        currentDeletingLog = null;
    }
    
    // Confirm and delete record
    function confirmDeleteRecord() {
        if (deletePasswordInput.value !== PASSWORD) {
            deletePasswordError.style.display = 'block';
            return;
        }
        
        if (currentDeletingLog) {
            // Filter out the log to delete
            medicationLogs = medicationLogs.filter(log => log.id !== currentDeletingLog.id);
            
            // Save data and update UI
            saveDataToStorage();
            updateLogTable();
            updateLastTakenTimes();
            showSuccessMessage(`Record for ${currentDeletingLog.medicine} deleted successfully!`);
            closeDeleteModal();
        }
    }
    
    // Show success message
    function showSuccessMessage(message) {
        successMessage.textContent = message;
        successMessage.style.opacity = '1';
        
        setTimeout(() => {
            successMessage.style.opacity = '0';
        }, 3000);
    }
});
