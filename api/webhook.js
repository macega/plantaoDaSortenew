const { getFirebaseAdmin } = require('./firebase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const db = getFirebaseAdmin().firestore();
    const payload = req.body || {};

    const remetente = payload?.sender || payload?.from || payload?.remoteJid || payload?.phone || null;
    const nome = payload?.name || payload?.senderName || payload?.participantName || 'Participante';
    const mensagem = payload?.message || payload?.text || payload?.body || '';
    const fotoUrl = payload?.photoUrl || payload?.profilePic || payload?.avatar || '';

    if (!remetente) {
      return res.status(400).json({ error: 'Remetente ausente no payload do webhook.' });
    }

    const telefone = String(remetente).replace(/[^\d+]/g, '').trim();
    const participanteRef = db.collection('participantes').doc(telefone);

    await participanteRef.set(
      {
        id: telefone,
        nome: nome || 'Participante',
        telefone,
        mensagem: mensagem || '',
        foto_url: fotoUrl || '',
        atualizado_em: new Date().toISOString(),
        ultima_mensagem: mensagem || '',
      },
      { merge: true }
    );

    return res.status(200).json({
      ok: true,
      participante: {
        id: telefone,
        nome: nome || 'Participante',
        telefone,
      },
    });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({
      ok: false,
      error: 'Erro ao processar o webhook do CodeChat.',
      details: error.message,
    });
  }
};
