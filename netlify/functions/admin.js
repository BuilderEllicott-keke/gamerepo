// netlify/functions/admin.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://ddoqcocxbdtiwvotqmyi.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkb3Fjb2N4YmR0aXd2b3RxbXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5Nzc1OTIsImV4cCI6MjA3MzU1MzU5Mn0.tR05IKupRtgH_RpV9yEIHn3ha_HRzKk7I-9RGtdWzq4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function validateAdminSession(sessionId) {
    const { data: session, error } = await supabase
        .from('user_sessions')
        .select(`
            *,
            users!inner(role)
        `)
        .eq('session_id', sessionId)
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error || !session || session.users.role !== 'admin') {
        return null;
    }

    return session;
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, PUT, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, message: 'Unauthorized - No token provided' })
            };
        }

        const sessionId = authHeader.split(' ')[1];
        const session = await validateAdminSession(sessionId);

        if (!session) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ success: false, message: 'Unauthorized - Invalid or expired session' })
            };
        }

        // GET requests
        if (event.httpMethod === 'GET') {
            const { action } = event.queryStringParameters || {};

            if (action === 'logs') {
                const { data: logs, error } = await supabase
                    .from('login_logs')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(100);

                if (error) throw error;

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, logs })
                };
            }

            if (action === 'users') {
                const { data: users, error } = await supabase
                    .from('users')
                    .select('id, username, role, is_active, created_at')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, users })
                };
            }

            if (action === 'sessions') {
                const { data: sessions, error } = await supabase
                    .from('user_sessions')
                    .select(`
                        *,
                        users!inner(username, role)
                    `)
                    .gt('expires_at', new Date().toISOString())
                    .order('created_at', { ascending: false });

                if (error) throw error;

                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, sessions })
                };
            }
        }

        // POST requests - Create new user
        if (event.httpMethod === 'POST') {
            const { username, password, role = 'user' } = JSON.parse(event.body);

            if (!username || !password) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, message: 'Username and password required' })
                };
            }

            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    username,
                    password,
                    role,
                    is_active: true
                })
                .select()
                .single();

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ success: false, message: 'Username already exists' })
                    };
                }
                throw error;
            }

            return {
                statusCode: 201,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'User created successfully',
                    user: { id: newUser.id, username: newUser.username, role: newUser.role }
                })
            };
        }

        // PUT requests - Update user
        if (event.httpMethod === 'PUT') {
            const { userId, username, password, role, is_active } = JSON.parse(event.body);

            if (!userId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, message: 'User ID required' })
                };
            }

            const updateData = {};
            if (username !== undefined) updateData.username = username;
            if (password !== undefined) updateData.password = password;
            if (role !== undefined) updateData.role = role;
            if (is_active !== undefined) updateData.is_active = is_active;

            const { data: updatedUser, error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', userId)
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ success: false, message: 'Username already exists' })
                    };
                }
                throw error;
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'User updated successfully',
                    user: updatedUser
                })
            };
        }

        // DELETE requests - Delete user
        if (event.httpMethod === 'DELETE') {
            const { userId } = JSON.parse(event.body);

            if (!userId) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, message: 'User ID required' })
                };
            }

            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    success: true, 
                    message: 'User deleted successfully'
                })
            };
        }

        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ success: false, message: 'Method not allowed' })
        };

    } catch (error) {
        console.error('Admin API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: 'Server error', error: error.message })
        };
    }
};