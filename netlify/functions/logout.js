// netlify/functions/logout.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ddoqcocxbdtiwvotqmyi.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkb3Fjb2N4YmR0aXd2b3RxbXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5Nzc1OTIsImV4cCI6MjA3MzU1MzU5Mn0.tR05IKupRtgH_RpV9yEIHn3ha_HRzKk7I-9RGtdWzq4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };
    }

    try {
        const { sessionId } = JSON.parse(event.body);

        if (!sessionId) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ success: false, message: 'Session ID required' })
            };
        }

        // Delete the session from the database
        const { error } = await supabase
            .from('user_sessions')
            .delete()
            .eq('session_id', sessionId);

        if (error) {
            console.error('Error deleting session:', error);
            throw error;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Logged out successfully' })
        };

    } catch (error) {
        console.error('Logout error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: 'Server error' })
        };
    }
};