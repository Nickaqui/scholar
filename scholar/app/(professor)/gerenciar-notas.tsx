import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import * as professorService from '../../services/professorService';

export default function GerenciarNotasScreen() {
  const { token } = useAuth();
  const { disciplinaId, disciplinaNome } = useLocalSearchParams();

  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [notaEditando, setNotaEditando] = useState<any>(null);

  const [form, setForm] = useState({
    tipo_avaliacao: '',
    nota: '',
    peso: '',
    data_avaliacao: '',
    observacoes: '',
  });

  useEffect(() => {
    carregarNotas();
  }, []);

  const carregarNotas = async () => {
    try {
      setLoading(true);
      const response = await professorService.listarNotasPorDisciplina(
        token!,
        parseInt(disciplinaId as string)
      );
      console.log('📊 Notas recebidas:', JSON.stringify(response.dados, null, 2));
      setNotas(response.dados || []);
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as notas');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalEditar = (nota: any) => {
    setNotaEditando(nota);
    
    // Garantir conversão correta dos valores
    const notaValor = typeof nota.nota === 'number' ? nota.nota : parseFloat(nota.nota || '0');
    const pesoValor = typeof nota.peso === 'number' ? nota.peso : parseFloat(nota.peso || '1');
    
    setForm({
      tipo_avaliacao: nota.tipo_avaliacao || 'Prova 1',
      nota: notaValor.toString(),
      peso: pesoValor.toString(),
      data_avaliacao: nota.data_avaliacao || new Date().toISOString().split('T')[0],
      observacoes: nota.observacoes || '',
    });
    setModalVisible(true);
  };

  const salvarEdicao = async () => {
    try {
      if (!form.nota || parseFloat(form.nota) < 0 || parseFloat(form.nota) > 10) {
        Alert.alert('Erro', 'A nota deve estar entre 0 e 10');
        return;
      }

      setLoading(true);
      await professorService.atualizarNota(token!, notaEditando.id, {
        tipo_avaliacao: form.tipo_avaliacao,
        nota: parseFloat(form.nota),
        peso: parseFloat(form.peso),
        data_avaliacao: form.data_avaliacao,
        observacoes: form.observacoes || undefined,
      });

      Alert.alert('Sucesso', 'Nota atualizada com sucesso');
      setModalVisible(false);
      carregarNotas();
    } catch (error: any) {
      Alert.alert(
        'Erro',
        error.response?.data?.mensagem || 'Não foi possível atualizar a nota'
      );
    } finally {
      setLoading(false);
    }
  };

  const confirmarExclusao = (nota: any) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente excluir a nota ${nota.tipo_avaliacao} de ${nota.aluno_nome}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => excluirNota(nota.id),
        },
      ]
    );
  };

  const excluirNota = async (notaId: number) => {
    try {
      setLoading(true);
      await professorService.excluirNota(token!, notaId);
      Alert.alert('Sucesso', 'Nota excluída com sucesso');
      carregarNotas();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir a nota');
    } finally {
      setLoading(false);
    }
  };

  const getNotaColor = (nota: number) => {
    if (nota >= 7) return '#10b981';
    if (nota >= 5) return '#f59e0b';
    return '#ef4444';
  };

  const renderNota = ({ item }: any) => {
    // Garantir que nota é um número
    const notaValor = typeof item.nota === 'number' ? item.nota : parseFloat(item.nota || '0');
    const pesoValor = typeof item.peso === 'number' ? item.peso : parseFloat(item.peso || '1');
    
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.alunoInfo}>
            <Text style={styles.alunoNome}>{item.aluno_nome || 'N/A'}</Text>
            <Text style={styles.alunoMatricula}>{item.aluno_matricula || ''}</Text>
          </View>
          <View style={[styles.notaBadge, { backgroundColor: getNotaColor(notaValor) }]}>
            <Text style={styles.notaText}>{notaValor.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.notaDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="document-text-outline" size={16} color="#666" />
            <Text style={styles.detailText}>{item.tipo_avaliacao || 'N/A'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="scale-outline" size={16} color="#666" />
            <Text style={styles.detailText}>Peso: {pesoValor.toFixed(1)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.data_avaliacao 
                ? new Date(item.data_avaliacao).toLocaleDateString('pt-BR')
                : 'N/A'
              }
            </Text>
          </View>

          {item.observacoes && (
            <View style={styles.observacoes}>
              <Text style={styles.observacoesText}>📝 {item.observacoes}</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => abrirModalEditar(item)}
          >
            <Ionicons name="create-outline" size={18} color="#2563eb" />
            <Text style={styles.editButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => confirmarExclusao(item)}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
            <Text style={styles.deleteButtonText}>Excluir</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && notas.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando notas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gerenciar Notas</Text>
        <Text style={styles.headerSubtitle}>{disciplinaNome}</Text>
        <Text style={styles.headerCount}>
          {notas.length} nota{notas.length !== 1 ? 's' : ''} lançada{notas.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={notas}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={renderNota}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              Nenhuma nota lançada ainda
            </Text>
          </View>
        }
      />

      {/* Modal de Edição */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Editar Nota</Text>

              {notaEditando && (
                <Text style={styles.modalSubtitle}>
                  {notaEditando.aluno_nome}
                </Text>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Tipo de Avaliação</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={form.tipo_avaliacao}
                    onValueChange={(value) =>
                      setForm({ ...form, tipo_avaliacao: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Prova 1" value="Prova 1" />
                    <Picker.Item label="Prova 2" value="Prova 2" />
                    <Picker.Item label="Prova 3" value="Prova 3" />
                    <Picker.Item label="Trabalho Prático" value="Trabalho Prático" />
                    <Picker.Item label="Projeto" value="Projeto" />
                    <Picker.Item label="Seminário" value="Seminário" />
                    <Picker.Item label="Participação" value="Participação" />
                    <Picker.Item label="Outro" value="Outro" />
                  </Picker>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Nota (0 a 10)</Text>
                <TextInput
                  style={styles.input}
                  value={form.nota}
                  onChangeText={(text) => setForm({ ...form, nota: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Peso</Text>
                <TextInput
                  style={styles.input}
                  value={form.peso}
                  onChangeText={(text) => setForm({ ...form, peso: text })}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Data (AAAA-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={form.data_avaliacao}
                  onChangeText={(text) => setForm({ ...form, data_avaliacao: text })}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Observações</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.observacoes}
                  onChangeText={(text) => setForm({ ...form, observacoes: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave]}
                  onPress={salvarEdicao}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.modalButtonSaveText}>Salvar</Text>
                  )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#10b981',
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#d1fae5',
    marginTop: 4,
  },
  headerCount: {
    fontSize: 14,
    color: '#d1fae5',
    marginTop: 8,
  },
  list: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  alunoInfo: {
    flex: 1,
  },
  alunoNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alunoMatricula: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  notaBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  notaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  notaDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  observacoes: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
  },
  observacoesText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  editButton: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  editButtonText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
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
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
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
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f3f4f6',
  },
  modalButtonCancelText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonSave: {
    backgroundColor: '#10b981',
  },
  modalButtonSaveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

