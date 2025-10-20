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

export default function MatriculasScreen() {
  const { token } = useAuth();
  const [matriculas, setMatriculas] = useState([]);
  const [alunos, setAlunos] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Formulário
  const [form, setForm] = useState({
    aluno_id: '',
    disciplina_id: '',
    semestre: '1',
    ano: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [matriculasRes, alunosRes, disciplinasRes] = await Promise.all([
        adminService.listarMatriculas(token!),
        adminService.listarAlunos(token!, { ativo: true }),
        adminService.listarDisciplinas(token!, { ativa: true }),
      ]);
      setMatriculas(matriculasRes.dados);
      setAlunos(alunosRes.dados);
      setDisciplinas(disciplinasRes.dados);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalCriar = () => {
    setForm({
      aluno_id: '',
      disciplina_id: '',
      semestre: '1',
      ano: new Date().getFullYear().toString(),
    });
    setModalVisible(true);
  };

  const salvarMatricula = async () => {
    try {
      if (!form.aluno_id || !form.disciplina_id || !form.semestre || !form.ano) {
        Alert.alert('Erro', 'Preencha todos os campos');
        return;
      }

      setLoading(true);

      const dados = {
        aluno_id: parseInt(form.aluno_id),
        disciplina_id: parseInt(form.disciplina_id),
        semestre: parseInt(form.semestre),
        ano: parseInt(form.ano),
      };

      await adminService.criarMatricula(token!, dados);
      Alert.alert('Sucesso', 'Matrícula criada com sucesso');
      setModalVisible(false);
      carregarDados();
    } catch (error: any) {
      console.error('Erro ao salvar matrícula:', error);
      Alert.alert('Erro', error.response?.data?.mensagem || 'Não foi possível salvar a matrícula');
    } finally {
      setLoading(false);
    }
  };

  const deletarMatricula = async (id: number, alunoNome: string, disciplinaNome: string) => {
    Alert.alert(
      'Confirmar',
      `Deseja realmente deletar a matrícula de ${alunoNome} em ${disciplinaNome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await adminService.deletarMatricula(token!, id);
              Alert.alert('Sucesso', 'Matrícula deletada com sucesso');
              carregarDados();
            } catch (error) {
              console.error('Erro ao deletar matrícula:', error);
              Alert.alert('Erro', 'Não foi possível deletar a matrícula');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cursando':
        return '#007AFF';
      case 'aprovado':
        return '#34C759';
      case 'reprovado':
        return '#FF3B30';
      case 'trancado':
        return '#FF9500';
      default:
        return '#8E8E93';
    }
  };

  const renderMatricula = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.aluno_nome}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.cardText}>📚 {item.disciplina_nome}</Text>
      <Text style={styles.cardText}>📋 Código: {item.disciplina_codigo}</Text>
      {item.professor_nome && (
        <Text style={styles.cardText}>👨‍🏫 Professor: {item.professor_nome}</Text>
      )}
      <Text style={styles.cardText}>📅 {item.semestre}º Semestre de {item.ano}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.btnDeletar}
          onPress={() => deletarMatricula(item.id, item.aluno_nome, item.disciplina_nome)}
        >
          <Text style={styles.btnText}>🗑️ Deletar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Botão adicionar */}
      <TouchableOpacity style={styles.btnAdicionar} onPress={abrirModalCriar}>
        <Text style={styles.btnAdicionarText}>+ Nova Matrícula</Text>
      </TouchableOpacity>

      {/* Lista de matrículas */}
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loading} />
      ) : (
        <FlatList
          data={matriculas}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMatricula}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhuma matrícula encontrada</Text>
          }
        />
      )}

      {/* Modal Criar */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Nova Matrícula</Text>

              <Text style={styles.label}>Aluno *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.aluno_id}
                  onValueChange={(value) => setForm({ ...form, aluno_id: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecione um aluno" value="" />
                  {alunos.map((aluno: any) => (
                    <Picker.Item
                      key={aluno.id}
                      label={`${aluno.nome} - ${aluno.matricula}`}
                      value={aluno.id.toString()}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Disciplina *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.disciplina_id}
                  onValueChange={(value) => setForm({ ...form, disciplina_id: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="Selecione uma disciplina" value="" />
                  {disciplinas.map((disc: any) => (
                    <Picker.Item
                      key={disc.id}
                      label={`${disc.nome} (${disc.codigo})`}
                      value={disc.id.toString()}
                    />
                  ))}
                </Picker>
              </View>

              <Text style={styles.label}>Semestre *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={form.semestre}
                  onValueChange={(value) => setForm({ ...form, semestre: value })}
                  style={styles.picker}
                >
                  <Picker.Item label="1º Semestre" value="1" />
                  <Picker.Item label="2º Semestre" value="2" />
                </Picker>
              </View>

              <Text style={styles.label}>Ano *</Text>
              <TextInput
                style={styles.input}
                value={form.ano}
                onChangeText={(text) => setForm({ ...form, ano: text })}
                placeholder="Ex: 2024"
                keyboardType="numeric"
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
                  onPress={salvarMatricula}
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 10,
  },
  btnDeletar: {
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

