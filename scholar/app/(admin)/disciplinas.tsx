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
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../../contexts/AuthContext';
import * as adminService from '../../services/adminService';

export default function DisciplinasScreen() {
  const { token } = useAuth();
  const [disciplinas, setDisciplinas] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState<any>(null);
  const [busca, setBusca] = useState('');

  // Formulário
  const [form, setForm] = useState({
    nome: '',
    codigo: '',
    carga_horaria: '',
    professor_id: '',
    descricao: '',
    semestre: '',
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [disciplinasRes, professoresRes] = await Promise.all([
        adminService.listarDisciplinas(token!, { busca }),
        adminService.listarProfessores(token!, { ativo: true }),
      ]);
      setDisciplinas(disciplinasRes.dados);
      setProfessores(professoresRes.dados);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCriar = () => {
    setModoEdicao(false);
    setDisciplinaSelecionada(null);
    setForm({
      nome: '',
      codigo: '',
      carga_horaria: '',
      professor_id: '',
      descricao: '',
      semestre: '',
    });
    setModalVisible(true);
  };

  const abrirModalEditar = (disciplina: any) => {
    setModoEdicao(true);
    setDisciplinaSelecionada(disciplina);
    setForm({
      nome: disciplina.nome,
      codigo: disciplina.codigo,
      carga_horaria: disciplina.carga_horaria ? disciplina.carga_horaria.toString() : '',
      professor_id: disciplina.professor_id ? disciplina.professor_id.toString() : '',
      descricao: disciplina.descricao || '',
      semestre: disciplina.semestre ? disciplina.semestre.toString() : '',
    });
    setModalVisible(true);
  };

  const salvarDisciplina = async () => {
    try {
      if (!form.nome || !form.codigo || !form.carga_horaria) {
        Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
        return;
      }

      setLoading(true);

      const dados = {
        ...form,
        carga_horaria: parseInt(form.carga_horaria),
        professor_id: form.professor_id ? parseInt(form.professor_id) : undefined,
        semestre: form.semestre ? parseInt(form.semestre) : undefined,
      };

      if (modoEdicao) {
        await adminService.atualizarDisciplina(token!, disciplinaSelecionada.id, dados);
        Alert.alert('Sucesso', 'Disciplina atualizada com sucesso');
      } else {
        await adminService.criarDisciplina(token!, dados);
        Alert.alert('Sucesso', 'Disciplina criada com sucesso');
      }

      setModalVisible(false);
      carregarDados();
    } catch (error: any) {
      console.error('Erro ao salvar disciplina:', error);
      Alert.alert('Erro', error.response?.data?.mensagem || 'Não foi possível salvar a disciplina');
    } finally {
      setLoading(false);
    }
  };

  const desativarDisciplina = async (id: number, nome: string) => {
    Alert.alert(
      'Confirmar',
      `Deseja realmente desativar a disciplina ${nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.desativarDisciplina(token!, id);
              Alert.alert('Sucesso', 'Disciplina desativada com sucesso');
              carregarDados();
            } catch (error) {
              console.error('Erro ao desativar disciplina:', error);
              Alert.alert('Erro', 'Não foi possível desativar a disciplina');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderDisciplina = ({ item }: any) => (
    <View style={[styles.card, !item.ativa && styles.cardInativo]}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.nome}</Text>
        <Text style={styles.cardBadge}>{item.ativa ? 'Ativa' : 'Inativa'}</Text>
      </View>
      <Text style={styles.cardText}>📋 Código: {item.codigo}</Text>
      <Text style={styles.cardText}>⏱️ Carga horária: {item.carga_horaria}h</Text>
      {item.semestre && <Text style={styles.cardText}>📅 Semestre: {item.semestre}º</Text>}
      {item.professor_nome && (
        <Text style={styles.cardText}>👨‍🏫 Professor: {item.professor_nome}</Text>
      )}
      {item.descricao && <Text style={styles.cardText}>📝 {item.descricao}</Text>}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.btnEditar}
          onPress={() => abrirModalEditar(item)}
        >
          <Text style={styles.btnText}>✏️ Editar</Text>
        </TouchableOpacity>
        {item.ativa && (
          <TouchableOpacity
            style={styles.btnDesativar}
            onPress={() => desativarDisciplina(item.id, item.nome)}
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
          placeholder="Buscar disciplina..."
          value={busca}
          onChangeText={setBusca}
          onSubmitEditing={carregarDados}
        />
        <TouchableOpacity style={styles.btnBuscar} onPress={carregarDados}>
          <Text style={styles.btnBuscarText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Botão adicionar */}
      <TouchableOpacity style={styles.btnAdicionar} onPress={abrirModalCriar}>
        <Text style={styles.btnAdicionarText}>+ Adicionar Disciplina</Text>
      </TouchableOpacity>

      {/* Lista de disciplinas */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />
      ) : (
        <FlatList
          data={disciplinas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDisciplina}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma disciplina encontrada</Text>
          }
        />
      )}

      {/* Modal Criar/Editar */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {modoEdicao ? 'Editar Disciplina' : 'Nova Disciplina'}
              </Text>

              <Text style={styles.label}>Nome *</Text>
              <TextInput
                style={styles.input}
                value={form.nome}
                onChangeText={(text) => setForm({ ...form, nome: text })}
                placeholder="Nome da disciplina"
              />

              <Text style={styles.label}>Código *</Text>
              <TextInput
                style={styles.input}
                value={form.codigo}
                onChangeText={(text) => setForm({ ...form, codigo: text })}
                placeholder="Ex: ENG001"
              />

              <Text style={styles.label}>Carga Horária (horas) *</Text>
              <TextInput
                style={styles.input}
                value={form.carga_horaria}
                onChangeText={(text) => setForm({ ...form, carga_horaria: text })}
                placeholder="Ex: 80"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Semestre</Text>
              <TextInput
                style={styles.input}
                value={form.semestre}
                onChangeText={(text) => setForm({ ...form, semestre: text })}
                placeholder="Ex: 1"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Professor</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.professor_id}
                  onValueChange={(value) => setForm({ ...form, professor_id: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecione um professor" value="" />
                  {professores.map((prof: any) => (
                    <Picker.Item
                      key={prof.id}
                      label={`${prof.nome} (${prof.titulacao})`}
                      value={prof.id.toString()}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={form.descricao}
                onChangeText={(text) => setForm({ ...form, descricao: text })}
                placeholder="Descrição da disciplina"
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
                  onPress={salvarDisciplina}
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
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  picker: {
    height: 50,
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

