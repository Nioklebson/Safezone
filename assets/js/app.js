// app.js - SafeZone Institutional Website

/* =========================
   MAPA INTERATIVO (Leaflet) COM REGISTRO DE OCORRÊNCIAS
   ========================= */
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar mapa apenas se o elemento existir
  const mapElement = document.getElementById('map');
  if (mapElement) {
    const map = L.map('map').setView([-23.55052, -46.633308], 13); // São Paulo

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Camada para marcadores de ocorrências
    let markersLayer = L.layerGroup().addTo(map);
    let tempMarker = null;

    // Carregar ocorrências do localStorage
    loadOcorrencias();

    // Evento de clique no mapa para registrar ocorrência
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;

      // Remover marcador temporário anterior
      if (tempMarker) map.removeLayer(tempMarker);

      // Criar novo marcador temporário
      tempMarker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(map);

      // Mostrar modal de registro
      showOcorrenciaModal(lat, lng);
    });

    // Função para carregar ocorrências
    function loadOcorrencias() {
      const ocorrencias = JSON.parse(localStorage.getItem('safezone_ocorrencias') || '[]');
      markersLayer.clearLayers();

      ocorrencias.forEach(ocorrencia => {
        const marker = L.marker([ocorrencia.lat, ocorrencia.lng], {
          icon: getMarkerIcon(ocorrencia.type)
        });

        const popupContent = `
          <div class="ocorrencia-popup">
            <h4>${ocorrencia.title}</h4>
            <p><strong>Tipo:</strong> ${getTypeLabel(ocorrencia.type)}</p>
            <p><strong>Descrição:</strong> ${ocorrencia.description}</p>
            <p><small>${new Date(ocorrencia.timestamp).toLocaleString()}</small></p>
          </div>
        `;

        marker.bindPopup(popupContent).addTo(markersLayer);
      });
    }

    // Função para obter ícone do marcador baseado no tipo
    function getMarkerIcon(type) {
      const colors = {
        assalto: 'red',
        suspeito: 'orange',
        acidente: 'blue',
        outro: 'green'
      };

      return L.icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${colors[type] || 'blue'}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
    }

    // Função para obter label do tipo
    function getTypeLabel(type) {
      const labels = {
        assalto: 'Assalto',
        suspeito: 'Comportamento Suspeito',
        acidente: 'Acidente',
        outro: 'Outro'
      };
      return labels[type] || type;
    }

    // Função para mostrar modal de registro
    function showOcorrenciaModal(lat, lng) {
      // Criar modal
      const modal = document.createElement('div');
      modal.className = 'ocorrencia-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Registrar Ocorrência</h3>
            <span class="modal-close">&times;</span>
          </div>
          <form class="ocorrencia-form">
            <div class="form-group">
              <label for="ocorrencia-title">Título da Ocorrência</label>
              <input type="text" id="ocorrencia-title" required placeholder="Ex: Assalto na rua X">
            </div>
            <div class="form-group">
              <label for="ocorrencia-type">Tipo</label>
              <select id="ocorrencia-type" required>
                <option value="">Selecione o tipo</option>
                <option value="assalto">Assalto</option>
                <option value="suspeito">Comportamento Suspeito</option>
                <option value="acidente">Acidente</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div class="form-group">
              <label for="ocorrencia-description">Descrição</label>
              <textarea id="ocorrencia-description" required rows="3" placeholder="Descreva o que aconteceu..."></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn-cancel">Cancelar</button>
              <button type="submit" class="btn-submit">Registrar</button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(modal);

      // Eventos do modal
      const closeBtn = modal.querySelector('.modal-close');
      const cancelBtn = modal.querySelector('.btn-cancel');
      const form = modal.querySelector('.ocorrencia-form');

      const closeModal = () => {
        if (tempMarker) map.removeLayer(tempMarker);
        tempMarker = null;
        document.body.removeChild(modal);
      };

      closeBtn.addEventListener('click', closeModal);
      cancelBtn.addEventListener('click', closeModal);

      // Fechar modal ao clicar fora
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      // Submissão do formulário
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const title = document.getElementById('ocorrencia-title').value.trim();
        const type = document.getElementById('ocorrencia-type').value;
        const description = document.getElementById('ocorrencia-description').value.trim();

        if (!title || !type || !description) {
          alert('Por favor, preencha todos os campos.');
          return;
        }

        // Salvar ocorrência
        const ocorrencia = {
          id: Date.now(),
          lat,
          lng,
          title,
          type,
          description,
          timestamp: new Date().toISOString()
        };

        const ocorrencias = JSON.parse(localStorage.getItem('safezone_ocorrencias') || '[]');
        ocorrencias.push(ocorrencia);
        localStorage.setItem('safezone_ocorrencias', JSON.stringify(ocorrencias));

        // Recarregar marcadores
        loadOcorrencias();

        // Remover marcador temporário
        if (tempMarker) map.removeLayer(tempMarker);
        tempMarker = null;

        // Fechar modal
        document.body.removeChild(modal);

        alert('Ocorrência registrada com sucesso!');
      });
    }
  }

  // Inicializar mapa de registro de ocorrência
  const reportMapElement = document.getElementById('report-map');
  if (reportMapElement) {
    const reportMap = L.map('report-map').setView([-23.55052, -46.633308], 13); // São Paulo

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(reportMap);

    let reportMarker = null;

    // Geolocation para centralizar no usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          reportMap.setView([lat, lng], 15);

          reportMarker = L.marker([lat, lng]).addTo(reportMap);
          reportMarker.bindPopup("📍 Você está aqui").openPopup();

          // Preencher campos de coordenadas
          document.getElementById('lat').value = lat;
          document.getElementById('lng').value = lng;
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
        }
      );
    }

    // Evento de clique no mapa para selecionar localização
    reportMap.on('click', (e) => {
      const { lat, lng } = e.latlng;

      if (reportMarker) reportMap.removeLayer(reportMarker);

      reportMarker = L.marker([lat, lng]).addTo(reportMap);
      reportMarker.bindPopup("📍 Local da ocorrência").openPopup();

      // Atualizar campos do formulário
      document.getElementById('lat').value = lat;
      document.getElementById('lng').value = lng;
    });
  }

  // Formulário de registro de ocorrência
  const reportForm = document.getElementById('report-form');
  if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const street = document.getElementById('street').value.trim();
      const neighborhood = document.getElementById('neighborhood').value.trim();
      const type = document.getElementById('type').value;
      const description = document.getElementById('description').value.trim();
      const lat = parseFloat(document.getElementById('lat').value);
      const lng = parseFloat(document.getElementById('lng').value);
      const anonymous = document.getElementById('anonymous').checked;

      if (!street || !neighborhood || !type || !description || isNaN(lat) || isNaN(lng)) {
        alert('Por favor, preencha todos os campos obrigatórios e selecione uma localização no mapa.');
        return;
      }

      // Salvar ocorrência no localStorage
      const ocorrencia = {
        id: Date.now(),
        street,
        neighborhood,
        type,
        description,
        lat,
        lng,
        anonymous,
        timestamp: new Date().toISOString()
      };

      const ocorrencias = JSON.parse(localStorage.getItem('safezone_ocorrencias') || '[]');
      ocorrencias.push(ocorrencia);
      localStorage.setItem('safezone_ocorrencias', JSON.stringify(ocorrencias));

      alert('Ocorrência registrada com sucesso!');
      reportForm.reset();

      // Recarregar mapa principal se existir
      if (typeof loadOcorrencias === 'function') {
        loadOcorrencias();
      }
    });
  }

  // Botão de busca de localização
  const searchLocationBtn = document.getElementById('search-location');
  if (searchLocationBtn) {
    searchLocationBtn.addEventListener('click', async () => {
      const street = document.getElementById('street').value.trim();
      const neighborhood = document.getElementById('neighborhood').value.trim();

      if (!street || !neighborhood) {
        alert('Por favor, preencha o nome da rua e bairro para buscar a localização.');
        return;
      }

      try {
        // Usar Nominatim API para geocodificação
        const query = `${street}, ${neighborhood}, São Paulo, Brasil`;
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
        const data = await response.json();

        if (data && data.length > 0) {
          const { lat, lon } = data[0];
          document.getElementById('lat').value = lat;
          document.getElementById('lng').value = lon;

          // Atualizar mapa se existir
          if (typeof reportMap !== 'undefined' && reportMarker) {
            reportMap.removeLayer(reportMarker);
            reportMarker = L.marker([lat, lon]).addTo(reportMap);
            reportMarker.bindPopup("📍 Local encontrado").openPopup();
            reportMap.setView([lat, lon], 16);
          }

          alert('Localização encontrada e marcada no mapa!');
        } else {
          alert('Localização não encontrada. Verifique se o endereço está correto.');
        }
      } catch (error) {
        console.error('Erro ao buscar localização:', error);
        alert('Erro ao buscar localização. Tente novamente.');
      }
    });
  }

  /* =========================
     NAVEGAÇÃO SUAVE
     ========================= */
  const navLinks = document.querySelectorAll('.nav-menu a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = targetSection.offsetTop - headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });

  /* =========================
     MENU HAMBURGUER (MOBILE)
     ========================= */
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      hamburger.classList.toggle('active');
    });

    // Fechar menu ao clicar em um link
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
      });
    });
  }

  /* =========================
     FORMULÁRIO DE CONTATO
     ========================= */
  const contatoForm = document.querySelector('.contato-form');
  if (contatoForm) {
    contatoForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Simulação de envio (em produção, integrar com backend)
      const formData = new FormData(contatoForm);
      const data = Object.fromEntries(formData);

      // Validação básica
      if (!data.nome || !data.email || !data.mensagem) {
        alert('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      // Simular envio
      alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
      contatoForm.reset();
    });
  }

  /* =========================
     ANIMAÇÕES DE SCROLL
     ========================= */
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observar elementos para animação
  const animateElements = document.querySelectorAll('.servico-card, .equipe-member, .portfolio-item');
  animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });

  /* =========================
     HEADER SCROLL EFFECT
     ========================= */
  const header = document.querySelector('.header');
  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      header.style.background = 'rgba(255, 255, 255, 0.95)';
      header.style.backdropFilter = 'blur(10px)';
    } else {
      header.style.background = 'var(--bg-white)';
      header.style.backdropFilter = 'none';
    }

    lastScrollY = window.scrollY;
  });
});
