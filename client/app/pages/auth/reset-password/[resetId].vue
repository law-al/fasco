<template>
  <div
    class="bg-[url('../../assets/auth-forgot-pass.jpg')] bg-center bg-no-repeat bg-cover"
  ></div>
  <div class="space-y-5 font-primary p-3">
    <h2 class="font-secondary font-bold text-4xl uppercase mb-[40px]">Fasco</h2>

    <div class="min-h-[500px] flex items-center">
      <div
        class="flex flex-col justify-center space-y-2 items-center mx-10 w-full"
      >
        <error-outlet :error="formError" />
        <p class="text-xl items-start mt-4 w-full mb-6">
          Enter your new Password
        </p>

        <client-only>
          <error-outlet v-if="formError">{{ formError }}</error-outlet>
          <form
            @submit.prevent="onSubmit"
            class="flex flex-col space-y-6 w-full"
          >
            <div class="flex flex-col items-start gap-6 w-full">
              <div class="flex flex-col gap-0.5 flex-1 w-full">
                <!-- Added flex-1 -->
                <input
                  id="password"
                  :class="
                    cn(
                      'bg-white border-b-2 border-gray-400 h-[35px] w-full appearance-none px-[10px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9'
                    )
                  "
                  type="password"
                  placeholder="New Password"
                  v-model="password"
                  v-bind="passwordAttr"
                />
                <error-outlet :error="errors.password" />
              </div>

              <div class="flex flex-col gap-0.5 flex-1 w-full">
                <!-- Added flex-1 -->
                <input
                  id="confirmPassword"
                  :class="
                    cn(
                      'bg-white border-b-2 border-gray-400 h-[35px] w-full appearance-none px-[10px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9'
                    )
                  "
                  type="password"
                  placeholder="Confirm New Password"
                  v-model="confirmPassword"
                  v-bind="confirmPasswordAttr"
                />
                <error-outlet :error="errors.confirmPassword" />
              </div>
            </div>

            <u-button
              type="submit"
              :loading="isLoading"
              size="xl"
              class="flex justify-center !bg-black cursor-pointer hover:bg-black/80 active:bg-black"
              >Reset password</u-button
            >
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
      password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
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

  const toast = useToast();

  function showToast() {
    toast.add({
      description: 'Password reset successful',
      progress: false,
    });
  }

  const onSubmit = handleSubmit(async (values) => {
    const { password: newPassword, confirmPassword: newConfirmPassword } =
      values;
    try {
      isLoading.value = true;
      const config = useRuntimeConfig();

      const response = await $fetch(
        `/api/v1/auth/reset-password/${route.params.resetId}`,
        {
          method: 'PATCH',
          baseURL: config.public.apiBase,
          body: { newPassword, newConfirmPassword },
        }
      );

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
