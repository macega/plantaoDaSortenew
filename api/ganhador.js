const { getFirebaseAdmin } = require('./firebase');

function ocultarTelefone(telefone = '') {
  if (!telefone) return '+55 (XX) 9****-0000';

  const valor = String(telefone).replace(/\D/g, '');
  if (valor.length < 10) return '+55 (XX) 9****-0000';

  const ddd = valor.slice(0, 2);
  const numero = valor.slice(2);

  if (numero.length >= 9) {
    const parteInicial = numero.slice(0, 5);
    const parteFinal = numero.slice(-4);
    return `+55 (${ddd}) ${parteInicial.replace(/\d/g, '*')}${parteFinal}`;
  }

  return `+55 (${ddd}) ${numero.slice(0, 2).replace(/\d/g, '*')}-${numero.slice(-4)}`;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido. Use GET.' });
  }

  try {
    const db = getFirebaseAdmin().firestore();
    const doc = await db.doc('ganhador_atual').get();

    if (!doc.exists) {
      return res.status(200).json([]);
    }

    const dados = doc.data() || {};
    const nome = dados.nome || 'Sem Nome';
    const telefone = dados.telefone || '';
    const fotoUrl = dados.foto_url || '';

    const payload = [
      {
        nome,
        telefone_oculto: ocultarTelefone(telefone),
        foto_url: fotoUrl,
      },
    ];

    return res.status(200).json(payload);
  } catch (error) {
    console.error('Erro ao obter ganhador:', error);
    return res.status(500).json({ error: 'Erro ao consultar o ganhador atual.' });
  }
};
