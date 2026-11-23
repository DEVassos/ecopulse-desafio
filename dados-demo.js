// Cópia dos dados do modo demonstração do app (frontend/src/services/demo-data.ts e regions.service.ts).
// Se a equipe mudar os dados de lá, mude aqui também, para as duas telas continuarem iguais.

window.ECOPULSE_DEMO = function () {
  const servico = (id, name, country, regionCode, region, city, cpuPercent, energyKwh, emissionsG, status) =>
    ({ id, name, country, regionCode, region, city, cpuPercent, energyKwh, emissionsG, status });

  const services = [
    servico('fraud-detector', 'Fraud Detector', 'Estados Unidos', 'us-east', 'Virgínia', 'Ashburn', 68, 0.0713, 26.9, 'ativo'),
    servico('recommendation-ai', 'Recommendation AI', 'Irlanda', 'eu-west', 'Leinster', 'Dublin', 74, 0.0868, 25.6, 'ativo'),
    servico('audit-stream', 'Audit Stream', 'Japão', 'jp-east', 'Kanto', 'Tóquio', 41, 0.0533, 24.8, 'ativo'),
    servico('checkout-worker', 'Checkout Worker', 'Estados Unidos', 'us-east', 'Virgínia', 'Ashburn', 45, 0.0467, 17.7, 'ativo'),
    servico('reporting-batch', 'Reporting Batch', 'Canadá', 'ca-central', 'Quebec', 'Montreal', 52, 0.0726, 2.9, 'ativo'),
    servico('email-dispatcher', 'Email Dispatcher', 'Brasil', 'br-sudeste', 'Sudeste', 'São Paulo', null, null, null, 'indisponivel'),
    servico('inventory-sync', 'Inventory Sync', 'Canadá', null, 'Ontario', null, null, null, null, 'sem_metricas'),
  ];

  const regions = [
    { code: 'us-east', country: 'Estados Unidos', region: 'Virgínia', city: 'Ashburn', carbonIntensityGco2ePerKwh: 377, renewableSharePercent: 22 },
    { code: 'eu-west', country: 'Irlanda', region: 'Leinster', city: 'Dublin', carbonIntensityGco2ePerKwh: 295, renewableSharePercent: 41 },
    { code: 'jp-east', country: 'Japão', region: 'Kanto', city: 'Tóquio', carbonIntensityGco2ePerKwh: 465, renewableSharePercent: 20 },
    { code: 'ca-central', country: 'Canadá', region: 'Quebec', city: 'Montreal', carbonIntensityGco2ePerKwh: 40, renewableSharePercent: 94 },
    { code: 'br-sudeste', country: 'Brasil', region: 'Sudeste', city: 'São Paulo', carbonIntensityGco2ePerKwh: 94, renewableSharePercent: 83 },
    { code: 'eu-north', country: 'Suécia', region: 'Estocolmo', city: 'Estocolmo', carbonIntensityGco2ePerKwh: 25, renewableSharePercent: 98 },
  ];

  return Promise.resolve({ services, regions });
};
