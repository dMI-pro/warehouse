import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Committee, CreateCommitteeDto, UpdateCommitteeDto } from '@/types/api';
import { apiService } from '@/services/api';

export const useCommitteesStore = defineStore('committees', () => {
  const committees = ref<Committee[]>([]);
  const currentCommittee = ref<Committee | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchCommittees = async () => {
    loading.value = true;
    error.value = null;
    try {
      committees.value = await apiService.getCommittees();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки коммитетов';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const fetchCommittee = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      currentCommittee.value = await apiService.getCommittee(id);
      return currentCommittee.value;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка загрузки коммитета';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const createCommittee = async (createCommitteeDto: CreateCommitteeDto) => {
    loading.value = true;
    error.value = null;
    try {
      const committee = await apiService.createCommittee(createCommitteeDto);
      await fetchCommittees();
      return committee;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка создания коммитета';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const updateCommittee = async (id: number, updateCommitteeDto: UpdateCommitteeDto) => {
    loading.value = true;
    error.value = null;
    try {
      const committee = await apiService.updateCommittee(id, updateCommitteeDto);
      await fetchCommittees();
      return committee;
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка обновления коммитета';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteCommittee = async (id: number) => {
    loading.value = true;
    error.value = null;
    try {
      await apiService.deleteCommittee(id);
      await fetchCommittees();
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Ошибка удаления коммитета';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    committees,
    currentCommittee,
    loading,
    error,
    fetchCommittees,
    fetchCommittee,
    createCommittee,
    updateCommittee,
    deleteCommittee,
  };
});

