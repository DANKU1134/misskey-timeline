// Vercel Serverless Function for Misskey Timeline
export default async function handler(req, res) {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // OPTIONSリクエストへの対応
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    try {
        // 環境変数からトークンとユーザーIDを取得
        const MISSKEY_TOKEN = process.env.MISSKEY_TOKEN || '8FsdG90g3CnSBZp5UAoLi6X9VnZ6T1je';
        const MISSKEY_USERID = process.env.MISSKEY_USERID; // 後で設定
        
        let endpoint = 'https://misskey.io/api/notes/timeline';
        let body = { 
            i: MISSKEY_TOKEN, 
            limit: 10,
            withFiles: false,
            includeReplies: true,
            includeMyRenotes: true
        };
        
        // ユーザーIDが設定されている場合は個人のタイムラインを取得
        if (MISSKEY_USERID) {
            endpoint = 'https://misskey.io/api/users/notes';
            body.userId = MISSKEY_USERID;
        }
        
        console.log('Fetching from:', endpoint);
        console.log('Request body:', body);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error(`Misskey API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // データを整形してリアクション情報も含める
        const formattedData = data.map(note => ({
            id: note.id,
            text: note.text || '[画像・ファイル]',
            url: note.url || `https://misskey.io/notes/${note.id}`,
            createdAt: note.createdAt,
            user: {
                username: note.user.username,
                name: note.user.name,
                avatarUrl: note.user.avatarUrl
            },
            reactions: note.reactions || {},
            reactionCount: Object.values(note.reactions || {}).reduce((sum, count) => sum + count, 0),
            repliesCount: note.repliesCount || 0,
            renoteCount: note.renoteCount || 0,
            files: note.files || []
        }));
        
        res.status(200).json(formattedData);
        
    } catch (error) {
        console.error('EBS Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch timeline',
            message: error.message 
        });
    }
}
