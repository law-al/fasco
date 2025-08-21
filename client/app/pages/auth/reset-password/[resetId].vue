<template>
  <div class="bg-[url('../../assets/auth-forgot-pass.jpg')] bg-center bg-no-repeat bg-cover"></div>
  <div class="space-y-5 font-primary p-3">
    <h2 class="font-secondary font-bold text-6xl mb-[40px]">Fasco</h2>

    <div class="min-h-[500px] flex items-center">
      <div class="flex flex-col justify-center space-y-2 items-center mx-10 w-full">
        <error-outlet :error="formError" />
        <p class="text-xl items-start mt-4 w-full mb-6">Enter your new Password</p>

        <client-only>
          <error-outlet v-if="formError">{{ formError }}</error-outlet>
          <form @submit.prevent="onSubmit" class="flex flex-col space-y-6 w-full">
            <div class="flex flex-col items-start gap-6 w-full">
              <div class="flex flex-col items-start gap-2 w-full">
                <UInput
                  v-model="password"
                  v-bind="passwordAttr"
                  placeholder="Password"
                  class="border-b-2 border-gray-400 outline-0 w-full"
                  :type="show ? 'text' : 'password'"
                  :ui="{
                    base: '!ring-0 focus:!ring-0 focus-visible:!ring-0',
                    trailing: 'pe-1',
                  }"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      :icon="show ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :aria-label="show ? 'Hide password' : 'Show password'"
                      :aria-pressed="show"
                      aria-controls="password"
                      @click="show = !show"
                    />
                  </template>
                </UInput>
                <error-outlet :error="errors.password" />
              </div>

              <div class="flex flex-col items-start gap-2 w-full">
                <UInput
                  v-model="confirmPassword"
                  v-bind="confirmPasswordAttr"
                  placeholder="Confirm password"
                  class="border-b-2 border-gray-400 outline-0 w-full"
                  :type="showConfirm ? 'text' : 'password'"
                  :ui="{
                    base: '!ring-0 focus:!ring-0 focus-visible:!ring-0',
                    trailing: 'pe-1',
                  }"
                >
                  <template #trailing>
                    <UButton
                      color="neutral"
                      variant="link"
                      size="sm"
                      :icon="showConfirm ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      :aria-label="showConfirm ? 'Hide password' : 'Show password'"
                      :aria-pressed="showConfirm"
                      aria-controls="password"
                      @click="showConfirm = !showConfirm"
                    />
                  </template>
                </UInput>
                <error-outlet :error="errors.confirmPassword" />
              </div>
            </div>

            <u-button type="submit" :loading="isLoading" size="xl" class="flex justify-center !bg-black cursor-pointer hover:bg-black/80 active:bg-black">Reset password</u-button>
          </form>
        </client-only>

        <div class="flex items-center gap-1">
          <p>Already have an account?</p>
          <nuxt-link to="/auth/login" class="text-indigo-500">Login</nuxt-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { toTypedSchema } from '@vee-validate/yup';
import { useForm } from 'vee-validate';
import * as yup from 'yup';

definePageMeta({
  layout: 'auth-layout',
});

const schema = toTypedSchema(
  yup.object({
    password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmPassword: yup
      .string()
      .required('Please confirm your password')
      .test('passwords-match', "Passwords don't match", function (value) {
        return this.parent.password === value;
      }),
  })
);

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: schema,
  initialValues: {
    password: '',
    confirmPassword: '',
  },
});

const [password, passwordAttr] = defineField('password');
const [confirmPassword, confirmPasswordAttr] = defineField('confirmPassword');

const isLoading = ref(false);
const formError = ref(null);
const route = useRoute();
const router = useRouter();
const show = ref(false);
const showConfirm = ref(false);

const toast = useToast();

function showToast() {
  toast.add({
    description: 'Password reset successful',
    progress: false,
  });
}

const onSubmit = handleSubmit(async values => {
  const { password: newPassword, confirmPassword: newConfirmPassword } = values;
  try {
    isLoading.value = true;
    const config = useRuntimeConfig();

    const response = await $fetch(`/api/v1/auth/reset-password/${route.params.resetId}`, {
      method: 'PATCH',
      baseURL: config.public.apiBase,
      body: { newPassword, newConfirmPassword },
    });

    if (response) {
      showToast();
      router.replace('/auth/login');
    }
  } catch (error) {
    console.log(error);
    formError.value = error?.data.message || 'Wrong credential';
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped></style>
