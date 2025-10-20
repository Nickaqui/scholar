import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import * as professorService from '../../services/professorService';

export default function DisciplinasScreen() {
  const { token, usuario } = useAuth();
  const router = useRouter();
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarDisciplinas();
  }, []);

  const carregarDisciplinas = async () => {
    try {
      setLoading(true);
      const response = await professorService.listarDisciplinasProfessor(token!);
      
      // Filtrar apenas disciplinas ativas do professor logado
      const minhasDisciplinas = response.dados.filter((d: any) => d.ativa);
      
      setDisciplinas(minhasDisciplinas);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as disciplinas');
    } finally {
      setLoading(false);
    }
  };

  const verAlunos = async (disciplina: any) => {
    try {
      const response = await professorService.listarAlunosPorDisciplina(token!, disciplina.id);
      const alunos = response.dados;
      
      if (alunos.length === 0) {
        Alert.alert('Aviso', 'Não há alunos matriculados nesta disciplina ainda.');
      } else {
        Alert.alert(
          `Alunos - ${disciplina.nome}`,
          `Total: ${alunos.length} alunos\n\n${alunos.map((a: any) => `• ${a.aluno_nome}`).join('\n')}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os alunos');
    }
  };

  const renderDisciplina = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.disciplinaInfo}>
          <Text style={styles.disciplinaNome}>{item.nome}</Text>
          <Text style={styles.disciplinaCodigo}>{item.codigo}</Text>
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="book" size={32} color="#2563eb" />
        </View>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="time-outline" size={16} color="#666" />
        <Text style={styles.infoText}>{item.carga_horaria}h</Text>
      </View>

      {item.semestre && (
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.infoText}>{item.semestre}º Semestre</Text>
        </View>
      )}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={() => verAlunos(item)}
        >
          <Ionicons name="people-outline" size={18} color="#2563eb" />
          <Text style={styles.buttonSecondaryText}>Ver Alunos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonPrimary]}
          onPress={() => router.push({
            pathname: '/(professor)/lancar-notas',
            params: { disciplinaId: item.id, disciplinaNome: item.nome }
          })}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.buttonPrimaryText}>Lançar Nota</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.buttonGerenciar}
        onPress={() => router.push({
          pathname: '/(professor)/gerenciar-notas',
          params: { disciplinaId: item.id, disciplinaNome: item.nome }
        })}
      >
        <Ionicons name="list-outline" size={18} color="#10b981" />
        <Text style={styles.buttonGerenciarText}>Gerenciar Notas</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Carregando disciplinas...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Minhas Disciplinas</Text>
        <Text style={styles.headerSubtitle}>
          {disciplinas.length} disciplina{disciplinas.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={disciplinas}
        keyExtractor={(item: any) => item.id.toString()}
        renderItem={renderDisciplina}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              Você ainda não tem disciplinas atribuídas
            </Text>
          </View>
        }
      />
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
    backgroundColor: '#2563eb',
    padding: 20,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e0e7ff',
    marginTop: 4,
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
  disciplinaInfo: {
    flex: 1,
  },
  disciplinaNome: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  disciplinaCodigo: {
    fontSize: 14,
    color: '#666',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonPrimary: {
    backgroundColor: '#2563eb',
  },
  buttonSecondary: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonSecondaryText: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonGerenciar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#10b981',
    marginTop: 8,
    gap: 6,
  },
  buttonGerenciarText: {
    color: '#10b981',
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
});

