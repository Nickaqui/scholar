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

export default function AlunosScreen() {
  const { token } = useAuth();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<any>(null);
  const [busca, setBusca] = useState('');

  // Formulário
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    matricula: '',
    curso: '',
    data_nascimento: '',
    endereco: '',
  });

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    try {
      setLoading(true);
      const response = await adminService.listarAlunos(token!, { busca });
      setAlunos(response.dados);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os alunos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCriar = () => {
    setModoEdicao(false);
    setAlunoSelecionado(null);
    setForm({
      nome: '',
      email: '',
      senha: '',
      matricula: '',
      curso: 'Desenvolvimento de Software Multiplataforma',
      data_nascimento: '',
      endereco: '',
    });
    setModalVisible(true);
  };

  const abrirModalEditar = (aluno: any) => {
    setModoEdicao(true);
    setAlunoSelecionado(aluno);
    setForm({
      nome: aluno.nome,
      email: aluno.email,
      senha: '',
      matricula: aluno.matricula,
      curso: aluno.curso,
      data_nascimento: aluno.data_nascimento || '',
      endereco: aluno.endereco || '',
    });
    setModalVisible(true);
  };

  const salvarAluno = async () => {
    try {
      if (!form.nome || !form.email || !form.matricula || !form.curso) {
        Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
        return;
      }

      if (!modoEdicao && !form.senha) {
        Alert.alert('Erro', 'Senha é obrigatória para criar novo aluno');
        return;
      }

      setLoading(true);

      if (modoEdicao) {
        const dadosAtualizacao = { ...form };
        if (!dadosAtualizacao.senha) {
          delete dadosAtualizacao.senha;
        }
        await adminService.atualizarAluno(token!, alunoSelecionado.id, dadosAtualizacao);
        Alert.alert('Sucesso', 'Aluno atualizado com sucesso');
      } else {
        await adminService.criarAluno(token!, form);
        Alert.alert('Sucesso', 'Aluno criado com sucesso');
      }

      setModalVisible(false);
      carregarAlunos();
    } catch (error: any) {
      console.error('Erro ao salvar aluno:', error);
      Alert.alert('Erro', error.response?.data?.mensagem || 'Não foi possível salvar o aluno');
    } finally {
      setLoading(false);
    }
  };

  const desativarAluno = async (id: number, nome: string) => {
    Alert.alert(
      'Confirmar',
      `Deseja realmente desativar o aluno ${nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.desativarAluno(token!, id);
              Alert.alert('Sucesso', 'Aluno desativado com sucesso');
              carregarAlunos();
            } catch (error) {
              console.error('Erro ao desativar aluno:', error);
              Alert.alert('Erro', 'Não foi possível desativar o aluno');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderAluno = ({ item }: any) => (
    <View style={[styles.card, !item.ativo && styles.cardInativo]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        <Text style={styles.cardBadge}>{item.ativo ? 'Ativo' : 'Inativo'}</Text>
      </View>
      <Text style={styles.cardText}>📧 {item.email}</Text>
      <Text style={styles.cardText}>🎓 Matrícula: {item.matricula}</Text>
      <Text style={styles.cardText}>📚 {item.curso}</Text>
      {item.data_nascimento && (
        <Text style={styles.cardText}>📅 Nascimento: {new Date(item.data_nascimento).toLocaleDateString('pt-BR')}</Text>
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
            onPress={() => desativarAluno(item.id, item.nome)}
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
          placeholder="Buscar aluno..."
          value={busca}
          onChangeText={setBusca}
          onSubmitEditing={carregarAlunos}
        />
        <TouchableOpacity style={styles.btnBuscar} onPress={carregarAlunos}>
          <Text style={styles.btnBuscarText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Botão adicionar */}
      <TouchableOpacity style={styles.btnAdicionar} onPress={abrirModalCriar}>
        <Text style={styles.btnAdicionarText}>+ Adicionar Aluno</Text>
      </TouchableOpacity>

      {/* Lista de alunos */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />
      ) : (
        <FlatList
          data={alunos}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderAluno}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum aluno encontrado</Text>
          }
        />
      )}

      {/* Modal Criar/Editar */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {modoEdicao ? 'Editar Aluno' : 'Novo Aluno'}
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

              <Text style={styles.label}>Matrícula *</Text>
              <TextInput
                style={styles.input}
                value={form.matricula}
                onChangeText={(text) => setForm({ ...form, matricula: text })}
                placeholder="ALU123456"
              />

              <Text style={styles.label}>Curso *</Text>
              <TextInput
                style={styles.input}
                value={form.curso}
                onChangeText={(text) => setForm({ ...form, curso: text })}
                placeholder="Nome do curso"
              />

              <Text style={styles.label}>Data de Nascimento</Text>
              <TextInput
                style={styles.input}
                value={form.data_nascimento}
                onChangeText={(text) => setForm({ ...form, data_nascimento: text })}
                placeholder="AAAA-MM-DD (ex: 2002-05-15)"
              />

              <Text style={styles.label}>Endereço</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={form.endereco}
                onChangeText={(text) => setForm({ ...form, endereco: text })}
                placeholder="Endereço completo"
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
                  onPress={salvarAluno}
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

