// netlify/functions/authenticate.js - Debug version
// First, let's create a simple version that doesn't use Supabase to isolate the issue

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };

    console.log('Function called with method:', event.httpMethod);
    console.log('Event body:', event.body);

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Basic validation
        if (!event.body) {
            console.log('No body provided');
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, message: 'No request body provided' })
            };
        }

        let requestData;
        try {
            requestData = JSON.parse(event.body);
            console.log('Parsed request data:', requestData);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, message: 'Invalid JSON in request body' })
            };
        }

        const { username, password, action } = requestData;

        console.log('Username:', username);
        console.log('Action:', action);

        // Simple hardcoded authentication for testing
        if (action === 'login') {
            if (username === 'admin' && password === 'admin123') {
                const response = {
                    success: true,
                    role: 'admin',
                    sessionId: 'test-session-' + Date.now(),
                    message: 'Login successful'
                };
                console.log('Sending response:', response);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(response)
                };
            } else if (username === 'GregEllicott' && password === '111010') {
                const response = {
                    success: true,
                    role: 'user',
                    sessionId: 'test-session-' + Date.now(),
                    message: 'Login successful'
                };
                console.log('Sending response:', response);
                
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(response)
                };
            } else {
                const response = {
                    success: false,
                    message: 'Invalid credentials'
                };
                console.log('Sending error response:', response);
                
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify(response)
                };
            }
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, message: 'Invalid action' })
        };

    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                success: false, 
                message: 'Server error: ' + error.message 
            })
        };
    }
};