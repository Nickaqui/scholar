import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="alunos" 
        options={{ 
          title: 'Gerenciar Alunos',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="professores" 
        options={{ 
          title: 'Gerenciar Professores',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="disciplinas" 
        options={{ 
          title: 'Gerenciar Disciplinas',
          headerShown: true 
        }} 
      />
      <Stack.Screen 
        name="matriculas" 
        options={{ 
          title: 'Gerenciar Matrículas',
          headerShown: true 
        }} 
      />
    </Stack>
  );
}

