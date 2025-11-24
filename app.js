// ================================
// SAFEZONE - APP PRINCIPAL
// ================================

// Importar funções necessárias do Firebase
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "firebase/firestore";

// ================================
// CONFIGURAÇÃO DO FIREBASE
// ================================
const firebaseConfig = {
  apiKey: "AIzaSyA4mQVykfQee8T2XsacdVfuUMDdOgJ37UA",
  authDomain: "safezone-cd02c.firebaseapp.com",
  projectId: "safezone-cd02c",
  storageBucket: "safezone-cd02c.firebasestorage.app",
  messagingSenderId: "583774786299",
  appId: "1:583774786299:web:82d6ed3e187d29a911d65e"
};

// Inicializar Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================================
// INICIALIZAÇÃO DO MAPA LEAFLET
// ================================
let map;
let marker;

// Função para iniciar o mapa
function initMap() {
  map = L.map("map").setView([-23.5505, -46.6333], 13); // fallback (São Paulo)

  // Adicionar camada de mapa base
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // ===== GEOLOCALIZAÇÃO AUTOMÁTICA =====
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        map.setView([lat, lng], 15);

        marker = L.marker([lat, lng]).addTo(map);
        marker.bindPopup("📍 Você está aqui").openPopup();

        // Preencher os campos de coordenadas no formulário
        document.getElementById("lat").value = lat;
        document.getElementById("lng").value = lng;
      },
      (error) => {
        console.error("Erro ao obter localização:", error);
        alert("Não foi possível obter sua localização.");
      }
    );
  }

  // ===== CLIQUE NO MAPA PARA NOVA OCORRÊNCIA =====
  map.on("click", (e) => {
    const { lat, lng } = e.latlng;

    if (marker) map.removeLayer(marker);

    marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup("📍 Local da ocorrência").openPopup();

    // Atualizar os campos no formulário
    document.getElementById("lat").value = lat;
    document.getElementById("lng").value = lng;
  });
}

// ================================
// FUNÇÃO PARA ENVIAR OCORRÊNCIA
// ================================
async function enviarOcorrencia(e) {
  e.preventDefault();

  const titulo = document.getElementById("title").value.trim();
  const tipo = document.getElementById("type").value;
  const descricao = document.getElementById("description").value.trim();
  const lat = parseFloat(document.getElementById("lat").value);
  const lng = parseFloat(document.getElementById("lng").value);
  const anonimo = document.getElementById("anonymous").checked;

  if (!titulo || !descricao) {
    alert("Preencha todos os campos obrigatórios!");
    return;
  }

  try {
    await addDoc(collection(db, "ocorrencias"), {
      titulo,
      tipo,
      descricao,
      lat,
      lng,
      anonimo,
      data: new Date().toISOString(),
    });

    alert("✅ Ocorrência registrada com sucesso!");
    document.getElementById("report-form").reset();

    // Atualizar o mapa com novas ocorrências
    carregarOcorrencias();
  } catch (error) {
    console.error("Erro ao salvar ocorrência:", error);
    alert("❌ Erro ao registrar ocorrência!");
  }
}

// ================================
// FUNÇÃO PARA CARREGAR OCORRÊNCIAS EXISTENTES
// ================================
async function carregarOcorrencias() {
  const querySnapshot = await getDocs(collection(db, "ocorrencias"));

  querySnapshot.forEach((doc) => {
    const dados = doc.data();
    if (dados.lat && dados.lng) {
      const marcador = L.marker([dados.lat, dados.lng]).addTo(map);
      marcador.bindPopup(`
        <b>${dados.titulo}</b><br>
        Tipo: ${dados.tipo}<br>
        ${dados.descricao}<br>
        ${dados.anonimo ? "(Enviado anonimamente)" : ""}
      `);
    }
  });
}

// ================================
// INICIALIZAÇÃO GERAL
// ================================
document.addEventListener("DOMContentLoaded", () => {
  initMap();
  carregarOcorrencias();

  const form = document.getElementById("report-form");
  form.addEventListener("submit", enviarOcorrencia);
});
