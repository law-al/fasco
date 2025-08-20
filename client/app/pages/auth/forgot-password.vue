<template>
  <div
    class="bg-[url('../../assets/auth-forgot-pass.jpg')] bg-center bg-no-repeat bg-cover"
  ></div>
  <div class="space-y-5 font-primary p-3">
    <h2 class="font-secondary font-bold text-4xl uppercase mb-[40px]">Fasco</h2>

    <div class="min-h-[500px] flex flex-col items-center justify-center mx-10">
      <transition name="fade" mode="out-in">
        <div v-if="resetinkIsSent" class="flex flex-col items-center gap-4">
          <img
            src="../../assets/icons/icons-checkmark-100.png"
            alt="checkMark"
            class=""
          />

          <p class="text-2xl">
            Password reset link sent. Please check your mail
          </p>

          <div class="flex items-center gap-1">
            <p>Already have an account?</p>
            <nuxt-link to="/auth/login" class="text-indigo-500"
              >Login</nuxt-link
            >
          </div>
        </div>

        <div
          v-else
          class="flex flex-col justify-center space-y-2 items-center mx-10 w-full"
        >
          <error-outlet :error="formError" />
          <p class="text-xl items-start mt-4 w-full mb-6">Forget Password</p>

          <client-only>
            <error-outlet v-if="formError">{{ formError }}</error-outlet>
            <form
              @submit.prevent="onSubmit"
              class="flex flex-col space-y-6 w-full"
            >
              <div class="flex items-start gap-2 w-full">
                <!-- Changed items-center to items-start -->
                <div class="flex flex-col gap-0.5 flex-1">
                  <!-- Added flex-1 to take full width -->
                  <input
                    id="email"
                    :class="
                      cn(
                        'w-full bg-white border-b-2 border-gray-400 flex h-[35px] appearance-none items-center px-[10px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9'
                      )
                    "
                    type="email"
                    placeholder="Email Address"
                    v-model="email"
                    v-bind="emailAttr"
                  />
                  <error-outlet :error="errors.email" />
                </div>
              </div>

              <u-button
                type="submit"
                :loading="isLoading"
                size="xl"
                class="flex justify-center !bg-black cursor-pointer hover:bg-black/80 active:bg-black"
                >Send confirmation mail</u-button
              >
            </form>
          </client-only>

          <div class="flex items-center gap-1">
            <p>Already have an account?</p>
            <nuxt-link to="/auth/login" class="text-indigo-500"
              >Login</nuxt-link
            >
          </div>
        </div>
      </transition>
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
      email: yup
        .string()
        .email('Please enter a valid email')
        .required('Email is required'),
    })
  );

  const { defineField, errors, handleSubmit } = useForm({
    validationSchema: schema,
    initialValues: {
      email: '',
    },
  });

  const [email, emailAttr] = defineField('email');

  const isLoading = ref(false);
  const formError = ref(null);
  const resetinkIsSent = ref(false);

  const onSubmit = handleSubmit(async (values) => {
    try {
      isLoading.value = true;
      const config = useRuntimeConfig();

      const response = await $fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        baseURL: config.public.apiBase,
        body: values,
        credentials: 'include',
      });

      if (response) {
        console.log(response);
        resetinkIsSent.value = true;
      }
    } catch (error) {
      console.log(error);
      formError.value = error?.data.message || 'Wrong credential';
      resetinkIsSent.value = false;
    } finally {
      isLoading.value = false;
    }
  });
</script>

<style scoped>
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: scale(0.95);
  }

  .fade-enter-active {
    transition: all 200ms ease-out;
  }

  .fade-leave-active {
    transition: all 200ms ease-in;
  }

  .fade-enter-to,
  .fade-leave-from {
    opacity: 1;
    transform: scale(1);
  }
</style>
