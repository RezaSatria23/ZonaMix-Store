module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const RAJAONGKIR_KEY = "UYAVNGwHd0aca6b1808c712ctUAix4js"; // Ganti dengan API key Anda
    
    try {
        const rajaOngkirResponse = await fetch('https://api.rajaongkir.com/starter/cost', {
            method: 'POST',
            headers: {
                'key': RAJAONGKIR_KEY,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams(req.body).toString()
        });
        
        const data = await rajaOngkirResponse.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};