const { getFirebaseAdmin } = require('./firebase');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Use POST.' });
  }

  try {
    const db = getFirebaseAdmin().firestore();
    const snapshot = await db.collection('participantes').get();

    const participantes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (!participantes.length) {
      return res.status(400).json({ ok: false, error: 'Nenhum participante encontrado.' });
    }

    const sorteado = participantes[Math.floor(Math.random() * participantes.length)];
    const vencedorRef = db.doc('ganhador_atual');

    await vencedorRef.set(
      {
        nome: sorteado.nome || 'Participante',
        telefone: sorteado.telefone || sorteado.id || '',
        foto_url: sorteado.foto_url || '',
        sorteado_em: new Date().toISOString(),
        dados: sorteado,
      },
      { merge: true }
    );

    return res.status(200).json({
      ok: true,
      ganhador: {
        nome: sorteado.nome || 'Participante',
        telefone: sorteado.telefone || sorteado.id || '',
        foto_url: sorteado.foto_url || '',
      },
    });
  } catch (error) {
    console.error('Erro ao sortear:', error);
    return res.status(500).json({
      ok: false,
      error: 'Erro ao realizar o sorteio.',
      details: error.message,
    });
  }
};
