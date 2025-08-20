<template>
  <div
    class="bg-[url('../../assets/auth-register.jpg')] bg-center bg-no-repeat bg-cover"
  ></div>
  <div class="min-h-[500px] flex items-center">
    <div class="space-y-5 font-primary p-3 w-full">
      <h2 class="font-secondary font-bold text-4xl uppercase mb-[40px]">
        Fasco
      </h2>

      <div class="flex flex-col justify-center space-y-6 items-center mx-10">
        <error-outlet :error="formError" />
        <p class="text-xl mb-2 items-start mt-1.5">Create account</p>
        <div class="flex items-center gap-8 w-full mt-5">
          <u-button
            icon="i-flat-color-icons-google"
            variant="outline"
            size="xl"
            to="/google.com"
            class="flex-1 justify-center"
            >Sign up with Google</u-button
          >

          <u-button
            icon="i-logos-google-gmail"
            variant="outline"
            size="xl"
            to="/gmail.com"
            class="flex-1 justify-center"
            >Sign up with Gmail</u-button
          >
        </div>

        <p class="text-gray-700">- OR -</p>

        <client-only>
          <form
            @submit.prevent="onSubmit"
            class="flex flex-col space-y-6 w-full"
          >
            <div class="flex items-start gap-2">
              <!-- Changed to items-start -->
              <div class="flex flex-col gap-0.5 flex-1">
                <!-- Added flex-1 -->
                <input
                  id="firstname"
                  :class="
                    cn(
                      'bg-white border-b-2 border-gray-400 h-[35px] w-full appearance-none px-[10px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9'
                    )
                  "
                  type="text"
                  placeholder="First Name"
                  v-model="firstname"
                  v-bind="firstnameAttr"
                />
                <error-outlet :error="errors.firstname" />
              </div>

              <div class="flex flex-col gap-0.5 flex-1">
                <!-- Added flex-1 -->
                <input
                  id="lastname"
                  :class="
                    cn(
                      'bg-white border-b-2 border-gray-400 h-[35px] w-full appearance-none px-[10px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9'
                    )
                  "
                  type="text"
                  placeholder="Last Name"
                  v-model="lastname"
                  v-bind="lastnameAttr"
                />
                <error-outlet :error="errors.lastname" />
              </div>
            </div>

            <div class="flex items-start gap-2">
              <!-- Changed to items-start -->
              <div class="flex flex-col gap-0.5 flex-1">
                <!-- Added flex-1 -->
                <input
                  id="email"
                  :class="
                    cn(
                      'bg-white border-b-2 border-gray-400 h-[35px] w-full appearance-none px-[10px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9'
                    )
                  "
                  type="email"
                  placeholder="Email Address"
                  v-model="email"
                  v-bind="emailAttr"
                />
                <error-outlet :error="errors.email" />
              </div>

              <div class="flex flex-col gap-0.5 flex-1">
                <!-- Added flex-1 -->
                <input
                  id="phone"
                  :class="
                    cn(
                      'bg-white border-b-2 border-gray-400 h-[35px] w-full appearance-none px-[10px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9'
                    )
                  "
                  type="tel"
                  placeholder="Phone Number"
                  v-model="phone"
                  v-bind="phoneAttr"
                />
                <error-outlet :error="errors.phone" />
              </div>
            </div>

            <div class="flex items-start gap-2">
              <!-- Changed to items-start -->
              <div class="flex flex-col gap-0.5 flex-1">
                <!-- Added flex-1 -->
                <input
                  id="password"
                  :class="
                    cn(
                      'bg-white border-b-2 border-gray-400 h-[35px] w-full appearance-none px-[10px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9'
                    )
                  "
                  type="password"
                  placeholder="Password"
                  v-model="password"
                  v-bind="passwordAttr"
                />
                <error-outlet :error="errors.password" />
              </div>

              <div class="flex flex-col gap-0.5 flex-1">
                <!-- Added flex-1 -->
                <input
                  id="confirmPassword"
                  :class="
                    cn(
                      'bg-white border-b-2 border-gray-400 h-[35px] w-full appearance-none px-[10px] text-sm leading-none outline-none selection:color-white selection:bg-blackA9'
                    )
                  "
                  type="password"
                  placeholder="Confirm Password"
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
              >Create Account</u-button
            >
          </form>
        </client-only>

        <div class="flex items-center gap-1 -mt-4">
          <p>Already have an account?</p>
          <nuxt-link to="/auth/login" class="text-indigo-500">Login</nuxt-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { useForm } from 'vee-validate';
  import { toTypedSchema } from '@vee-validate/yup';
  import * as yup from 'yup';

  definePageMeta({
    layout: 'auth-layout',
  });

  const schema = toTypedSchema(
    yup.object({
      firstname: yup.string().required('Firstname is required'),
      lastname: yup.string().required('Lastname is required'),
      email: yup
        .string()
        .email('Please enter a valid email')
        .required('Email is required'),
      phone: yup
        .string()
        .min(10, 'Number must be at least 10 digits')
        .matches(/^[\+]?[0-9\-\(\)\s]+$/, 'Please enter a valid phone number')
        .required('Phone number is required'),
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

  const { handleSubmit, errors, defineField } = useForm({
    validationSchema: schema,
    // Add initial values to prevent hydration issues
    initialValues: {
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Remove the validation disable options - let them validate normally
  const [firstname, firstnameAttr] = defineField('firstname');
  const [lastname, lastnameAttr] = defineField('lastname');
  const [email, emailAttr] = defineField('email');
  const [phone, phoneAttr] = defineField('phone');
  const [password, passwordAttr] = defineField('password');
  const [confirmPassword, confirmPasswordAttr] = defineField('confirmPassword');

  const isLoading = ref(false);
  const formError = ref(null);

  const onSubmit = handleSubmit(async (values) => {
    try {
      isLoading.value = true;
      const config = useRuntimeConfig();
      const response = await $fetch('/api/v1/auth/register', {
        method: 'POST',
        baseURL: config.public.apiBase,
        body: values,
      });

      console.log('User created:', response);
    } catch (error) {
      console.log(error);
      formError.value =
        error.data?.message || error.message || 'Something went wrong';
    } finally {
      isLoading.value = false;
    }
  });
</script>

<style scoped></style>
