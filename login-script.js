// Updated login-script.js with better error handling
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Show loading state
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;

    fetch('/.netlify/functions/authenticate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
            username, 
            password,
            action: 'login'
        }),
    })
    .then(response => {
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        // Check if response is ok
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Get the response text first to see what we're actually getting
        return response.text().then(text => {
            console.log('Raw response text:', text);
            
            // Try to parse as JSON
            if (!text.trim()) {
                throw new Error('Empty response from server');
            }
            
            try {
                return JSON.parse(text);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                console.error('Response text that failed to parse:', text);
                throw new Error('Invalid JSON response from server');
            }
        });
    })
    .then(data => {
        console.log('Parsed data:', data);
        
        if (data.success) {
            // Store session ID
            localStorage.setItem('sessionId', data.sessionId);
            localStorage.setItem('userRole', data.role);
            
            // Redirect based on role
            if (data.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'secret-website.html';
            }
        } else {
            alert(data.message || 'Invalid username or password');
        }
    })
    .catch(error => {
        console.error('Full error details:', error);
        
        // Show more specific error messages
        if (error.message.includes('Failed to fetch')) {
            alert('Network error. Please check your connection and try again.');
        } else if (error.message.includes('Empty response')) {
            alert('Server returned empty response. Please check your Netlify functions.');
        } else if (error.message.includes('Invalid JSON')) {
            alert('Server returned invalid response. Please check server logs.');
        } else {
            alert(`Error: ${error.message}`);
        }
    })
    .finally(() => {
        // Restore button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
});