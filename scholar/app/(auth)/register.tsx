import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import authService from '../../services/authService';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [tipo, setTipo] = useState<'aluno' | 'professor' | 'administrador'>('aluno');
  const [carregando, setCarregando] = useState(false);

  const handleRegister = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    if (senha.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setCarregando(true);
    try {
      await authService.registrar({ nome, email, senha, tipo });
      Alert.alert(
        'Sucesso',
        'Cadastro realizado com sucesso! Faça login para continuar.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Erro ao registrar', error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Preencha os dados abaixo</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nome Completo</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu nome"
              value={nome}
              onChangeText={setNome}
              editable={!carregando}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!carregando}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tipo de Usuário</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tipo}
                onValueChange={(value) => setTipo(value)}
                enabled={!carregando}
                style={styles.picker}
              >
                <Picker.Item label="Aluno" value="aluno" />
                <Picker.Item label="Professor" value="professor" />
                <Picker.Item label="Administrador" value="administrador" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              editable={!carregando}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirmar Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite a senha novamente"
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              secureTextEntry
              editable={!carregando}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, carregando && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
            disabled={carregando}
          >
            <Text style={styles.linkText}>Já tem uma conta? Faça login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 16,
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
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#2563eb',
    fontSize: 14,
  },
});

