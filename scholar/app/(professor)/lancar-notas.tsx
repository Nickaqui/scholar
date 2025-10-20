import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import * as professorService from '../../services/professorService';

export default function LancarNotasScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const { disciplinaId, disciplinaNome } = useLocalSearchParams();

  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    aluno_id: '',
    tipo_avaliacao: 'Prova 1',
    nota: '',
    peso: '1.0',
    data_avaliacao: new Date().toISOString().split('T')[0],
    observacoes: '',
  });

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    try {
      setLoading(true);
      const response = await professorService.listarAlunosPorDisciplina(
        token!,
        parseInt(disciplinaId as string)
      );
      setAlunos(response.dados);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
      Alert.alert('Erro', 'Não foi possível carregar os alunos');
    } finally {
      setLoading(false);
    }
  };

  const validarForm = () => {
    if (!form.aluno_id) {
      Alert.alert('Erro', 'Selecione um aluno');
      return false;
    }
    if (!form.tipo_avaliacao) {
      Alert.alert('Erro', 'Informe o tipo de avaliação');
      return false;
    }
    if (!form.nota || isNaN(parseFloat(form.nota))) {
      Alert.alert('Erro', 'Informe uma nota válida');
      return false;
    }
    const nota = parseFloat(form.nota);
    if (nota < 0 || nota > 10) {
      Alert.alert('Erro', 'A nota deve estar entre 0 e 10');
      return false;
    }
    if (!form.peso || isNaN(parseFloat(form.peso))) {
      Alert.alert('Erro', 'Informe um peso válido');
      return false;
    }
    if (!form.data_avaliacao) {
      Alert.alert('Erro', 'Informe a data da avaliação');
      return false;
    }
    return true;
  };

  const lancarNota = async () => {
    if (!validarForm()) return;

    try {
      setSalvando(true);
      await professorService.lancarNota(token!, {
        aluno_id: parseInt(form.aluno_id),
        disciplina_id: parseInt(disciplinaId as string),
        tipo_avaliacao: form.tipo_avaliacao,
        nota: parseFloat(form.nota),
        peso: parseFloat(form.peso),
        data_avaliacao: form.data_avaliacao,
        observacoes: form.observacoes || undefined,
      });

      Alert.alert(
        'Sucesso',
        'Nota lançada com sucesso!',
        [
          {
            text: 'Lançar outra',
            onPress: () => {
              setForm({
                ...form,
                aluno_id: '',
                nota: '',
                observacoes: '',
              });
            },
          },
          {
            text: 'Voltar',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erro ao lançar nota:', error);
      Alert.alert(
        'Erro',
        error.response?.data?.mensagem || 'Não foi possível lançar a nota'
      );
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando alunos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="create" size={48} color="#2563eb" />
        <Text style={styles.title}>Lançar Nota</Text>
        <Text style={styles.subtitle}>{disciplinaNome}</Text>
      </View>

      <View style={styles.form}>
        {/* Aluno */}
        <View style={styles.field}>
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
                  key={aluno.aluno_id}
                  label={`${aluno.aluno_nome} - ${aluno.aluno_matricula}`}
                  value={aluno.aluno_id.toString()}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Tipo de Avaliação */}
        <View style={styles.field}>
          <Text style={styles.label}>Tipo de Avaliação *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.tipo_avaliacao}
              onValueChange={(value) => setForm({ ...form, tipo_avaliacao: value })}
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

        {/* Nota */}
        <View style={styles.field}>
          <Text style={styles.label}>Nota (0 a 10) *</Text>
          <TextInput
            style={styles.input}
            value={form.nota}
            onChangeText={(text) => setForm({ ...form, nota: text })}
            placeholder="Ex: 8.5"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Peso */}
        <View style={styles.field}>
          <Text style={styles.label}>Peso *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.peso}
              onValueChange={(value) => setForm({ ...form, peso: value })}
              style={styles.picker}
            >
              <Picker.Item label="Peso 1.0" value="1.0" />
              <Picker.Item label="Peso 2.0" value="2.0" />
              <Picker.Item label="Peso 3.0" value="3.0" />
              <Picker.Item label="Peso 4.0" value="4.0" />
              <Picker.Item label="Peso 5.0" value="5.0" />
            </Picker>
          </View>
        </View>

        {/* Data */}
        <View style={styles.field}>
          <Text style={styles.label}>Data da Avaliação *</Text>
          <TextInput
            style={styles.input}
            value={form.data_avaliacao}
            onChangeText={(text) => setForm({ ...form, data_avaliacao: text })}
            placeholder="AAAA-MM-DD"
          />
          <Text style={styles.hint}>Formato: AAAA-MM-DD (ex: 2024-10-20)</Text>
        </View>

        {/* Observações */}
        <View style={styles.field}>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.observacoes}
            onChangeText={(text) => setForm({ ...form, observacoes: text })}
            placeholder="Observações opcionais"
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Botões */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.buttonCancel]}
            onPress={() => router.back()}
            disabled={salvando}
          >
            <Text style={styles.buttonCancelText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSubmit]}
            onPress={lancarNota}
            disabled={salvando}
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.buttonSubmitText}>Lançar Nota</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    backgroundColor: '#2563eb',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#e0e7ff',
    marginTop: 4,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonCancel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonCancelText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSubmit: {
    backgroundColor: '#2563eb',
  },
  buttonSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

