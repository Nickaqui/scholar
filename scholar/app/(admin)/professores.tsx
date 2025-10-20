import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import * as adminService from '../../services/adminService';

export default function ProfessoresScreen() {
  const { token } = useAuth();
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [professorSelecionado, setProfessorSelecionado] = useState<any>(null);
  const [busca, setBusca] = useState('');

  // Formulário (SEM cpf e telefone)
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    titulacao: '',
    tempo_docencia: '',
    especializacao: '',
  });

  useEffect(() => {
    carregarProfessores();
  }, []);

  const carregarProfessores = async () => {
    try {
      setLoading(true);
      const response = await adminService.listarProfessores(token!, { busca });
      setProfessores(response.dados);
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
      Alert.alert('Erro', 'Não foi possível carregar os professores');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCriar = () => {
    setModoEdicao(false);
    setProfessorSelecionado(null);
    setForm({
      nome: '',
      email: '',
      senha: '',
      titulacao: '',
      tempo_docencia: '',
      especializacao: '',
    });
    setModalVisible(true);
  };

  const abrirModalEditar = (professor: any) => {
    setModoEdicao(true);
    setProfessorSelecionado(professor);
    setForm({
      nome: professor.nome,
      email: professor.email,
      senha: '',
      titulacao: professor.titulacao,
      tempo_docencia: professor.tempo_docencia ? professor.tempo_docencia.toString() : '',
      especializacao: professor.especializacao || '',
    });
    setModalVisible(true);
  };

  const salvarProfessor = async () => {
    try {
      if (!form.nome || !form.email || !form.titulacao) {
        Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
        return;
      }

      if (!modoEdicao && !form.senha) {
        Alert.alert('Erro', 'Senha é obrigatória para criar novo professor');
        return;
      }

      setLoading(true);

      const dados = {
        ...form,
        tempo_docencia: form.tempo_docencia ? parseInt(form.tempo_docencia) : undefined,
      };

      if (modoEdicao) {
        const dadosAtualizacao = { ...dados };
        if (!dadosAtualizacao.senha) {
          delete dadosAtualizacao.senha;
        }
        await adminService.atualizarProfessor(token!, professorSelecionado.id, dadosAtualizacao);
        Alert.alert('Sucesso', 'Professor atualizado com sucesso');
      } else {
        await adminService.criarProfessor(token!, dados);
        Alert.alert('Sucesso', 'Professor criado com sucesso');
      }

      setModalVisible(false);
      carregarProfessores();
    } catch (error: any) {
      console.error('Erro ao salvar professor:', error);
      Alert.alert('Erro', error.response?.data?.mensagem || 'Não foi possível salvar o professor');
    } finally {
      setLoading(false);
    }
  };

  const desativarProfessor = async (id: number, nome: string) => {
    Alert.alert(
      'Confirmar',
      `Deseja realmente desativar o professor ${nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.desativarProfessor(token!, id);
              Alert.alert('Sucesso', 'Professor desativado com sucesso');
              carregarProfessores();
            } catch (error) {
              console.error('Erro ao desativar professor:', error);
              Alert.alert('Erro', 'Não foi possível desativar o professor');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderProfessor = ({ item }: any) => (
    <View style={[styles.card, !item.ativo && styles.cardInativo]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        <Text style={styles.cardBadge}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
      </View>
      <Text style={styles.cardText}>📧 {item.email}</Text>
      <Text style={styles.cardText}>🎓 {item.titulacao}</Text>
      {item.tempo_docencia && (
        <Text style={styles.cardText}>⏱️ {item.tempo_docencia} anos de docência</Text>
      )}
      {item.especializacao && (
        <Text style={styles.cardText}>📚 Especialização: {item.especializacao}</Text>
      )}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.btnEditar}
          onPress={() => abrirModalEditar(item)}
        >
          <Text style={styles.btnText}>✏️ Editar</Text>
        </TouchableOpacity>
        {item.ativo && (
          <TouchableOpacity
            style={styles.btnDesativar}
            onPress={() => desativarProfessor(item.id, item.nome)}
          >
            <Text style={styles.btnText}>🚫 Desativar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Barra de busca */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar professor..."
          value={busca}
          onChangeText={setBusca}
          onSubmitEditing={carregarProfessores}
        />
        <TouchableOpacity style={styles.btnBuscar} onPress={carregarProfessores}>
          <Text style={styles.btnBuscarText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Botão adicionar */}
      <TouchableOpacity style={styles.btnAdicionar} onPress={abrirModalCriar}>
        <Text style={styles.btnAdicionarText}>+ Adicionar Professor</Text>
      </TouchableOpacity>

      {/* Lista de professores */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />
      ) : (
        <FlatList
          data={professores}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProfessor}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum professor encontrado</Text>
          }
        />
      )}

      {/* Modal Criar/Editar */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {modoEdicao ? 'Editar Professor' : 'Novo Professor'}
              </Text>

              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={form.nome}
                onChangeText={(text) => setForm({ ...form, nome: text })}
                placeholder="Nome completo"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
                placeholder="email@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Senha {!modoEdicao && '*'}</Text>
              <TextInput
                style={styles.input}
                value={form.senha}
                onChangeText={(text) => setForm({ ...form, senha: text })}
                placeholder={modoEdicao ? 'Deixe vazio para manter' : 'Senha'}
                secureTextEntry
              />

              <Text style={styles.label}>Titulação *</Text>
              <TextInput
                style={styles.input}
                value={form.titulacao}
                onChangeText={(text) => setForm({ ...form, titulacao: text })}
                placeholder="Ex: Mestrado, Doutorado"
              />

              <Text style={styles.label}>Tempo de Docência (anos)</Text>
              <TextInput
                style={styles.input}
                value={form.tempo_docencia}
                onChangeText={(text) => setForm({ ...form, tempo_docencia: text })}
                placeholder="Ex: 10"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Especialização</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={form.especializacao}
                onChangeText={(text) => setForm({ ...form, especializacao: text })}
                placeholder="Área de especialização"
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.btnCancelar}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.btnCancelarText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnSalvar}
                  onPress={salvarProfessor}
                  disabled={loading}
                >
                  <Text style={styles.btnSalvarText}>
                    {loading ? 'Salvando...' : 'Salvar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9f9f9',
  },
  btnBuscar: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  btnBuscarText: {
    fontSize: 18,
  },
  btnAdicionar: {
    margin: 15,
    padding: 15,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
  },
  btnAdicionarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  list: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardInativo: {
    opacity: 0.6,
    backgroundColor: '#f0f0f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  cardBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10,
  },
  btnEditar: {
    flex: 1,
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    alignItems: 'center',
  },
  btnDesativar: {
    flex: 1,
    padding: 10,
    backgroundColor: '#FF3B30',
    borderRadius: 6,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loading: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  btnCancelar: {
    flex: 1,
    padding: 15,
    backgroundColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
  },
  btnCancelarText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnSalvar: {
    flex: 1,
    padding: 15,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSalvarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

