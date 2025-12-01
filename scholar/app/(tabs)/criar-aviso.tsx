import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { avisosService, CriarAvisoDTO } from '@/services/avisosService';
import { Picker } from '@react-native-picker/picker';
import api from '@/services/api';

interface Disciplina {
  id: number;
  nome: string;
  codigo: string;
}

export default function CriarAvisoScreen() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [carregandoDisciplinas, setCarregandoDisciplinas] = useState(false);
  
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tipo, setTipo] = useState<'institucional' | 'lembrete' | 'comunicado' | 'prova'>('comunicado');
  const [disciplinaId, setDisciplinaId] = useState<number | undefined>(undefined);
  const [dataEvento, setDataEvento] = useState('');
  
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);

  useEffect(() => {
    if (usuario?.tipo === 'professor') {
      carregarDisciplinas();
    } else if (usuario?.tipo === 'administrador') {
      carregarTodasDisciplinas();
    }
  }, [usuario]);

  const carregarDisciplinas = async () => {
    setCarregandoDisciplinas(true);
    try {
      // O backend agora filtra automaticamente as disciplinas do professor
      const response = await api.get('/disciplinas');
      setDisciplinas(response.data.dados || []);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
      Alert.alert('Erro', 'Erro ao carregar disciplinas');
    } finally {
      setCarregandoDisciplinas(false);
    }
  };

  const carregarTodasDisciplinas = async () => {
    setCarregandoDisciplinas(true);
    try {
      const response = await api.get('/disciplinas');
      setDisciplinas(response.data.dados || []);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    } finally {
      setCarregandoDisciplinas(false);
    }
  };

  const handleCriar = async () => {
    if (!titulo.trim() || !conteudo.trim()) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    setCarregando(true);
    try {
      const aviso: CriarAvisoDTO = {
        titulo: titulo.trim(),
        conteudo: conteudo.trim(),
        tipo,
        disciplina_id: disciplinaId,
        data_evento: dataEvento || undefined,
      };

      await avisosService.criar(aviso);
      Alert.alert('Sucesso', 'Aviso criado com sucesso!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao criar aviso');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Novo Aviso</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de Aviso *</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tipo}
                onValueChange={(value) => setTipo(value)}
                style={styles.picker}
              >
                <Picker.Item label="Comunicado" value="comunicado" />
                <Picker.Item label="Lembrete" value="lembrete" />
                <Picker.Item label="Institucional" value="institucional" />
                <Picker.Item label="Prova" value="prova" />
              </Picker>
            </View>
          </View>

          {disciplinas.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Disciplina (opcional)</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={disciplinaId || 0}
                  onValueChange={(value) => setDisciplinaId(value === 0 ? undefined : value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Geral (todas as disciplinas)" value={0} />
                  {disciplinas.map((disc) => (
                    <Picker.Item
                      key={disc.id}
                      label={`${disc.codigo} - ${disc.nome}`}
                      value={disc.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Título *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Aviso de prova de Matemática"
              value={titulo}
              onChangeText={setTitulo}
              maxLength={255}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Conteúdo *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Digite o conteúdo do aviso..."
              value={conteudo}
              onChangeText={setConteudo}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Data do Evento (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="DD/MM/AAAA (ex: 25/12/2024)"
              value={dataEvento}
              onChangeText={setDataEvento}
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              Use para avisos de provas ou eventos com data específica
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, carregando && styles.buttonDisabled]}
          onPress={handleCriar}
          disabled={carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Publicar Aviso</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
  },
  pickerContainer: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

