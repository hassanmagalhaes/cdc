import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// 🔧 Coloque suas credenciais do Firebase aqui
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

let contadorGlobal = 1;

export default function App() {
  const [registros, setRegistros] = useState([]);
  const [form, setForm] = useState({
    responsavel: "",
    telefone: "",
    crianca: "",
    idade: "",
    sala: "1",
    observacao: "",
  });
  const [notificacoes, setNotificacoes] = useState([]);

  // 🔔 Solicitar permissão para notificações push
  useEffect(() => {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        getToken(messaging, { vapidKey: "SUA_VAPID_KEY" })
          .then((currentToken) => {
            if (currentToken) {
              console.log("Token de notificação:", currentToken);
            }
          })
          .catch((err) => console.error("Erro ao pegar token:", err));
      }
    });

    onMessage(messaging, (payload) => {
      console.log("Mensagem recebida:", payload);
      alert(`Notificação: ${payload.notification.title} - ${payload.notification.body}`);
    });
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const adicionarRegistro = () => {
    const novo = {
      ...form,
      numero: contadorGlobal++,
      notificacao: "",
    };
    setRegistros([...registros, novo]);
    setForm({ responsavel: "", telefone: "", crianca: "", idade: "", sala: "1", observacao: "" });
  };

  const resetar = () => {
    setRegistros([]);
    setNotificacoes([]);
    contadorGlobal = 1;
  };

  const enviarNotificacao = (index) => {
    const mensagem = prompt("Digite a mensagem para o responsável:");
    if (mensagem) {
      const atualizados = [...registros];
      atualizados[index].notificacao = mensagem;
      setRegistros(atualizados);
      setNotificacoes([...notificacoes, { crianca: atualizados[index].crianca, responsavel: atualizados[index].responsavel, mensagem }]);

      // 🔔 Enviar push notification
      fetch("https://fcm.googleapis.com/fcm/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "key=SUA_SERVER_KEY"
        },
        body: JSON.stringify({
          to: "/topics/responsaveis",
          notification: {
            title: `Chamada para ${atualizados[index].responsavel}`,
            body: mensagem,
          }
        })
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-200 to-pink-200 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Controle de Entrada - Ministério Infantil</h1>

      <div className="max-w-xl mx-auto p-4 bg-white rounded-xl shadow-md">
        <input className="w-full p-2 border rounded mb-2" name="responsavel" placeholder="Nome do responsável" value={form.responsavel} onChange={handleChange} />
        <input className="w-full p-2 border rounded mb-2" name="telefone" placeholder="Telefone" value={form.telefone} onChange={handleChange} />
        <input className="w-full p-2 border rounded mb-2" name="crianca" placeholder="Nome da criança" value={form.crianca} onChange={handleChange} />
        <input className="w-full p-2 border rounded mb-2" name="idade" placeholder="Idade" value={form.idade} onChange={handleChange} />
        <select className="w-full p-2 border rounded mb-2" name="sala" value={form.sala} onChange={handleChange}>
          {[1,2,3,4,5,6].map(sala => <option key={sala} value={sala}>Sala {sala}</option>)}
        </select>
        <textarea className="w-full p-2 border rounded mb-2" name="observacao" placeholder="Observações" value={form.observacao} onChange={handleChange}></textarea>

        <button onClick={adicionarRegistro} className="w-full bg-blue-500 text-white p-2 rounded mb-2">Adicionar Criança</button>
        <button onClick={resetar} className="w-full bg-red-500 text-white p-2 rounded">Resetar Dia</button>
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Lista do Dia</h2>
      <div className="grid gap-2">
        {registros.map((r, i) => (
          <div key={i} className="p-4 bg-white rounded shadow">
            <p><strong>Número:</strong> {r.numero}</p>
            <p><strong>Criança:</strong> {r.crianca} ({r.idade} anos)</p>
            <p><strong>Sala:</strong> {r.sala}</p>
            <p><strong>Responsável:</strong> {r.responsavel} ({r.telefone})</p>
            {r.observacao && <p><strong>Obs:</strong> {r.observacao}</p>}
            {r.notificacao && <p className="text-red-600"><strong>Notificação:</strong> {r.notificacao}</p>}
            <button onClick={() => enviarNotificacao(i)} className="mt-2 bg-yellow-500 text-white p-2 rounded">Chamar Responsável</button>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-semibold mt-6 mb-2">Notificações Enviadas</h2>
      <div className="grid gap-2">
        {notificacoes.map((n, i) => (
          <div key={i} className="p-4 bg-yellow-100 rounded shadow">
            <p><strong>Criança:</strong> {n.crianca}</p>
            <p><strong>Responsável:</strong> {n.responsavel}</p>
            <p><strong>Mensagem:</strong> {n.mensagem}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
